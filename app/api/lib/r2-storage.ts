// Cloudflare R2 Storage Service
export interface R2UploadOptions {
  contentType?: string;
  cacheControl?: string;
  metadata?: Record<string, string>;
}

export interface R2FileInfo {
  key: string;
  size: number;
  contentType: string;
  url: string;
  uploadedAt: Date;
}

export class R2StorageService {
  private baseUrl: string;

  constructor(bucketName: string = 'armstrong-haulage') {
    this.baseUrl = `https://${bucketName}.r2.cloudflarestorage.com`;
  }

  async uploadFile(
    file: File | Blob,
    path: string,
    options?: R2UploadOptions
  ): Promise<R2FileInfo> {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(`/api/r2?key=${encodeURIComponent(path)}`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const data = await response.json();

      return {
        key: path,
        size: (file as any).size,
        contentType: options?.contentType || (file as File).type,
        url: data.url,
        uploadedAt: new Date(),
      };
    } catch (error) {
      console.error('R2 upload error:', error);
      throw error;
    }
  }

  async uploadFileWithProgress(
    file: File,
    path: string,
    onProgress: (progress: number) => void,
    options?: R2UploadOptions
  ): Promise<R2FileInfo> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = (e.loaded / e.total) * 100;
          onProgress(progress);
        }
      });

      xhr.addEventListener('load', async () => {
        if (xhr.status === 200) {
          try {
            const data = JSON.parse(xhr.responseText);
            resolve({
              key: path,
              size: file.size,
              contentType: options?.contentType || file.type,
              url: data.url,
              uploadedAt: new Date(),
            });
          } catch (error) {
            reject(error);
          }
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload error'));
      });

      const formData = new FormData();
      formData.append('file', file);

      xhr.open('PUT', `/api/r2?key=${encodeURIComponent(path)}`, true);
      xhr.send(formData);
    });
  }

  async downloadFile(path: string): Promise<Blob> {
    try {
      const response = await fetch(`/api/r2?key=${encodeURIComponent(path)}`);

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      return response.blob();
    } catch (error) {
      console.error('R2 download error:', error);
      throw error;
    }
  }

  getFileUrl(path: string): string {
    return `/api/r2?key=${encodeURIComponent(path)}`;
  }

  getPublicUrl(path: string): string {
    return `${this.baseUrl}/${path}`;
  }

  async deleteFile(path: string): Promise<void> {
    try {
      const response = await fetch(`/api/r2?key=${encodeURIComponent(path)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`);
      }
    } catch (error) {
      console.error('R2 delete error:', error);
      throw error;
    }
  }

  async deleteFiles(paths: string[]): Promise<void> {
    await Promise.all(paths.map((path) => this.deleteFile(path)));
  }

  async copyFile(sourcePath: string, destPath: string): Promise<void> {
    try {
      const blob = await this.downloadFile(sourcePath);
      await this.uploadFile(blob, destPath);
    } catch (error) {
      console.error('R2 copy error:', error);
      throw error;
    }
  }
}

let storageInstance: R2StorageService | null = null;

export function getR2Storage(): R2StorageService {
  if (!storageInstance) {
    storageInstance = new R2StorageService();
  }
  return storageInstance;
}
