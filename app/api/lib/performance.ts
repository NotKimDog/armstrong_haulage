// Performance Monitoring & Analytics
export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
  tags?: Record<string, string>;
}

export interface PageMetrics {
  pageLoad: number;
  domContentLoaded: number;
  firstPaint: number;
  firstContentfulPaint: number;
  largestContentfulPaint?: number;
  cumulativeLayoutShift?: number;
  interactions: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private pageMetrics: Partial<PageMetrics> = {};

  /**
   * Record a custom performance metric
   */
  recordMetric(
    name: string,
    value: number,
    unit: string = 'ms',
    tags?: Record<string, string>
  ): void {
    this.metrics.push({
      name,
      value,
      unit,
      timestamp: Date.now(),
      tags,
    });
  }

  /**
   * Measure execution time of a function
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    tags?: Record<string, string>
  ): Promise<T> {
    const start = performance.now();
    try {
      return await fn();
    } finally {
      const duration = performance.now() - start;
      this.recordMetric(name, duration, 'ms', tags);
    }
  }

  /**
   * Measure execution time of sync function
   */
  measureSync<T>(
    name: string,
    fn: () => T,
    tags?: Record<string, string>
  ): T {
    const start = performance.now();
    try {
      return fn();
    } finally {
      const duration = performance.now() - start;
      this.recordMetric(name, duration, 'ms', tags);
    }
  }

  /**
   * Collect web vitals
   */
  collectWebVitals(): void {
    if (typeof window === 'undefined') return;

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
    if (navigation) {
      this.pageMetrics.pageLoad = navigation.loadEventEnd - navigation.fetchStart;
      this.pageMetrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart;
      this.pageMetrics.interactions = performance.getEntriesByType('measure').length;
    }

    const paints = performance.getEntriesByType('paint');
    paints.forEach((entry: PerformanceEntry) => {
      if (entry.name === 'first-paint') {
        this.pageMetrics.firstPaint = entry.startTime;
      }
      if (entry.name === 'first-contentful-paint') {
        this.pageMetrics.firstContentfulPaint = entry.startTime;
      }
    });
  }

  /**
   * Get average metric by name
   */
  getAverageMetric(name: string): number {
    const relevant = this.metrics.filter((m) => m.name === name);
    if (relevant.length === 0) return 0;
    const sum = relevant.reduce((acc, m) => acc + m.value, 0);
    return sum / relevant.length;
  }

  /**
   * Get metrics summary
   */
  getSummary(): {
    totalMetrics: number;
    averageMetricValue: number;
    pageMetrics: Partial<PageMetrics>;
    topMetrics: PerformanceMetric[];
  } {
    const topMetrics = [...this.metrics]
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    const avgValue = this.metrics.length > 0 
      ? this.metrics.reduce((acc, m) => acc + m.value, 0) / this.metrics.length 
      : 0;

    return {
      totalMetrics: this.metrics.length,
      averageMetricValue: avgValue,
      pageMetrics: this.pageMetrics,
      topMetrics,
    };
  }

  /**
   * Export metrics for analytics
   */
  export(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.pageMetrics = {};
  }
}

export const performanceMonitor = new PerformanceMonitor();

/**
 * Send metrics to analytics endpoint
 */
export async function sendMetricsToAnalytics(metrics: PerformanceMetric[]): Promise<boolean> {
  try {
    const response = await fetch('/api/telemetry', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'performance',
        metrics,
        timestamp: Date.now(),
        url: typeof window !== 'undefined' ? window.location.pathname : '',
      }),
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to send metrics:', error);
    return false;
  }
}

/**
 * Setup automatic metrics reporting
 */
export function setupAutomaticMetricsReporting(interval: number = 30000): () => void {
  if (typeof window === 'undefined') return () => {};

  performanceMonitor.collectWebVitals();

  const intervalId = setInterval(() => {
    const metrics = performanceMonitor.export();
    if (metrics.length > 0) {
      sendMetricsToAnalytics(metrics);
      performanceMonitor.clear();
    }
  }, interval);

  return () => clearInterval(intervalId);
}
