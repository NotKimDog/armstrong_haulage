// Batch Operations & Queue Management
export interface BatchOperation<T> {
  id: string;
  task: () => Promise<T>;
  priority: number;
  retries: number;
  maxRetries: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: T;
  error?: Error;
}

export interface BatchQueue<T> {
  operations: BatchOperation<T>[];
  activeCount: number;
  maxConcurrent: number;
}

/**
 * Queue manager for batch operations with retry logic
 */
export class OperationQueue<T> {
  private queue: BatchOperation<T>[] = [];
  private activeCount = 0;
  private maxConcurrent: number;

  constructor(maxConcurrent: number = 5) {
    this.maxConcurrent = maxConcurrent;
  }

  /**
   * Add operation to queue
   */
  async enqueue(
    task: () => Promise<T>,
    options?: {
      priority?: number;
      maxRetries?: number;
    }
  ): Promise<string> {
    const id = `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const operation: BatchOperation<T> = {
      id,
      task,
      priority: options?.priority ?? 0,
      retries: 0,
      maxRetries: options?.maxRetries ?? 3,
      status: 'pending',
    };

    this.queue.push(operation);
    this.queue.sort((a, b) => b.priority - a.priority);
    this.process();

    return id;
  }

  /**
   * Process queue
   */
  private async process(): Promise<void> {
    while (this.activeCount < this.maxConcurrent && this.queue.length > 0) {
      const operation = this.queue.shift();
      if (!operation) return;

      this.activeCount++;
      operation.status = 'processing';

      try {
        operation.result = await operation.task();
        operation.status = 'completed';
      } catch (error) {
        if (operation.retries < operation.maxRetries) {
          operation.retries++;
          operation.status = 'pending';
          this.queue.unshift(operation);
        } else {
          operation.status = 'failed';
          operation.error = error instanceof Error ? error : new Error(String(error));
        }
      } finally {
        this.activeCount--;
        this.process();
      }
    }
  }

  /**
   * Get operation status
   */
  getStatus(operationId: string): BatchOperation<T> | undefined {
    return this.queue.find((op) => op.id === operationId);
  }

  /**
   * Get queue stats
   */
  getStats() {
    const total = this.queue.length;
    const pending = this.queue.filter((op) => op.status === 'pending').length;
    const processing = this.queue.filter((op) => op.status === 'processing').length;
    const completed = this.queue.filter((op) => op.status === 'completed').length;
    const failed = this.queue.filter((op) => op.status === 'failed').length;

    return { total, pending, processing, completed, failed, activeCount: this.activeCount };
  }

  /**
   * Clear queue
   */
  clear(): void {
    this.queue = [];
    this.activeCount = 0;
  }
}

/**
 * Batch processor for parallel operations
 */
export class BatchProcessor {
  /**
   * Process items in batches
   */
  static async processBatch<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize: number = 10
  ): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map(processor));
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Process with error handling
   */
  static async processBatchSafe<T, R>(
    items: T[],
    processor: (item: T) => Promise<R>,
    batchSize: number = 10,
    onError?: (error: Error, item: T) => void
  ): Promise<(R | null)[]> {
    const results: (R | null)[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(batch.map(processor));

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push(null);
          onError?.(result.reason, batch[index]);
        }
      });
    }

    return results;
  }
}

/**
 * Request deduplication to prevent duplicate API calls
 */
export class RequestDeduplicator {
  private pending = new Map<string, Promise<any>>();

  /**
   * Deduplicate requests with same key
   */
  async deduplicate<T>(
    key: string,
    fetcher: () => Promise<T>
  ): Promise<T> {
    if (this.pending.has(key)) {
      return this.pending.get(key)!;
    }

    const promise = fetcher().finally(() => {
      this.pending.delete(key);
    });

    this.pending.set(key, promise);
    return promise;
  }

  /**
   * Clear pending requests
   */
  clear(): void {
    this.pending.clear();
  }
}

/**
 * Task scheduler for delayed/scheduled operations
 */
export class TaskScheduler {
  private tasks = new Map<string, NodeJS.Timeout>();

  /**
   * Schedule task to run after delay
   */
  schedule<T>(
    id: string,
    task: () => Promise<T>,
    delay: number
  ): void {
    // Cancel existing task
    if (this.tasks.has(id)) {
      clearTimeout(this.tasks.get(id)!);
    }

    const timeout = setTimeout(async () => {
      try {
        await task();
      } catch (error) {
        console.error(`Task ${id} failed:`, error);
      } finally {
        this.tasks.delete(id);
      }
    }, delay);

    this.tasks.set(id, timeout);
  }

  /**
   * Cancel scheduled task
   */
  cancel(id: string): boolean {
    const timeout = this.tasks.get(id);
    if (timeout) {
      clearTimeout(timeout);
      this.tasks.delete(id);
      return true;
    }
    return false;
  }

  /**
   * Get all scheduled tasks
   */
  getScheduled(): string[] {
    return Array.from(this.tasks.keys());
  }

  /**
   * Clear all tasks
   */
  clear(): void {
    this.tasks.forEach((timeout) => clearTimeout(timeout));
    this.tasks.clear();
  }
}

/**
 * Circuit breaker pattern for fault tolerance
 */
export class CircuitBreaker {
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime = 0;
  private resetTimeout: NodeJS.Timeout | null = null;

  constructor(
    private failureThreshold: number = 5,
    private successThreshold: number = 2,
    private timeout: number = 60000 // 1 minute
  ) {}

  /**
   * Execute operation with circuit breaker protection
   */
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      const timeSinceLastFailure = Date.now() - this.lastFailureTime;
      if (timeSinceLastFailure > this.timeout) {
        this.state = 'half-open';
        this.successCount = 0;
      } else {
        throw new Error('Circuit breaker is open');
      }
    }

    try {
      const result = await operation();

      if (this.state === 'half-open') {
        this.successCount++;
        if (this.successCount >= this.successThreshold) {
          this.state = 'closed';
          this.failureCount = 0;
          this.successCount = 0;
        }
      }

      return result;
    } catch (error) {
      this.failureCount++;
      this.lastFailureTime = Date.now();

      if (this.failureCount >= this.failureThreshold) {
        this.state = 'open';
      }

      throw error;
    }
  }

  /**
   * Get circuit breaker status
   */
  getStatus() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
    };
  }

  /**
   * Reset circuit breaker
   */
  reset(): void {
    this.state = 'closed';
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
  }
}
