// Image and Media Optimization
export interface ImageOptimizationOptions {
  quality?: number; // 1-100
  maxWidth?: number;
  maxHeight?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'avif';
  cache?: boolean;
}

/**
 * Generate optimized image URL with query parameters
 */
export function getOptimizedImageUrl(
  url: string,
  options: ImageOptimizationOptions = {}
): string {
  if (!url) return '';

  const {
    quality = 80,
    maxWidth,
    maxHeight,
    format = 'webp',
    cache = true,
  } = options;

  // If it's already a next/image optimized URL, return as is
  if (url.includes('/_next/image')) return url;

  const params = new URLSearchParams();
  params.append('q', quality.toString());
  if (maxWidth) params.append('w', maxWidth.toString());
  if (maxHeight) params.append('h', maxHeight.toString());
  params.append('fmt', format);
  if (cache) params.append('cache', 'true');

  return `${url}?${params.toString()}`;
}

/**
 * Preload images for better performance
 */
export function preloadImage(url: string): void {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = url;
  document.head.appendChild(link);
}

/**
 * Responsive image srcSet generator
 */
export function generateSrcSet(
  baseUrl: string,
  sizes: number[] = [320, 640, 1024, 1280]
): string {
  return sizes
    .map((size) => {
      const optimized = getOptimizedImageUrl(baseUrl, { maxWidth: size });
      return `${optimized} ${size}w`;
    })
    .join(', ');
}

/**
 * Lazy loading configuration
 */
export const lazyLoadingDefaults = {
  loading: 'lazy' as const,
  decoding: 'async' as const,
};

/**
 * Video optimization helper
 */
export interface VideoOptimizationOptions {
  autoplay?: boolean;
  controls?: boolean;
  loop?: boolean;
  muted?: boolean;
  poster?: string;
  preload?: 'none' | 'metadata' | 'auto';
}

export function getVideoOptimizationAttrs(
  options: VideoOptimizationOptions = {}
): Record<string, any> {
  return {
    autoPlay: options.autoplay ?? false,
    controls: options.controls ?? true,
    loop: options.loop ?? false,
    muted: options.muted ?? true,
    poster: options.poster,
    preload: options.preload ?? 'metadata',
  };
}

/**
 * Calculate image aspect ratio
 */
export function getImageAspectRatio(width: number, height: number): string {
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const divisor = gcd(width, height);
  return `${width / divisor} / ${height / divisor}`;
}

/**
 * Lazy load images with IntersectionObserver
 */
export function lazyLoadImages(selector: string = '[data-lazy-src]'): () => void {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    return () => {};
  }

  const images = document.querySelectorAll(selector);
  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const src = img.getAttribute('data-lazy-src');
        if (src) {
          img.src = src;
          img.removeAttribute('data-lazy-src');
          observer.unobserve(img);
        }
      }
    });
  });

  images.forEach((img) => imageObserver.observe(img));

  return () => {
    images.forEach((img) => imageObserver.unobserve(img));
  };
}

/**
 * CDN image URL builder
 */
export class CDNImageBuilder {
  constructor(private baseUrl: string) {}

  build(
    path: string,
    options: ImageOptimizationOptions & {
      width?: number;
      height?: number;
      grayscale?: boolean;
      blur?: number;
      brightness?: number;
      contrast?: number;
    } = {}
  ): string {
    const params = new URLSearchParams();

    if (options.width) params.append('w', options.width.toString());
    if (options.height) params.append('h', options.height.toString());
    if (options.quality) params.append('q', options.quality.toString());
    if (options.format) params.append('fmt', options.format);
    if (options.grayscale) params.append('grayscale', 'true');
    if (options.blur) params.append('blur', options.blur.toString());
    if (options.brightness) params.append('brightness', options.brightness.toString());
    if (options.contrast) params.append('contrast', options.contrast.toString());

    return `${this.baseUrl}/${path}?${params.toString()}`;
  }
}

/**
 * Media query helper for responsive images
 */
export const mediaQueries = {
  mobile: '(max-width: 640px)',
  tablet: '(min-width: 641px) and (max-width: 1024px)',
  desktop: '(min-width: 1025px)',
  retina: '(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)',
};

/**
 * Picture element helper
 */
export interface PictureSourceOptions {
  srcset: string;
  media?: string;
  type?: string;
}

export function generatePictureHTML(
  sources: PictureSourceOptions[],
  fallbackSrc: string,
  alt: string
): string {
  const sourceElements = sources
    .map((source) => {
      let html = '<source';
      if (source.media) html += ` media="${source.media}"`;
      if (source.type) html += ` type="${source.type}"`;
      html += ` srcset="${source.srcset}" />`;
      return html;
    })
    .join('\n  ');

  return `
    <picture>
      ${sourceElements}
      <img src="${fallbackSrc}" alt="${alt}" loading="lazy" decoding="async" />
    </picture>
  `;
}
