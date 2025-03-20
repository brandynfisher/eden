import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Merges Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Proxy configuration for media assets
const PROXY_CONFIG = {
  // Whether to use a proxy for videos
  enabled: true,

  // List of proxy options to try, in order of preference
  proxies: [
    // Local API route proxy
    {
      name: 'local',
      getUrl: (url: string) => {
        const proxyUrl = new URL('/api/proxy', window.location.origin)
        proxyUrl.searchParams.set('url', url)
        return proxyUrl.toString()
      },
    },
    // Example of a potential external proxy service (not implemented)
    // {
    //   name: 'external',
    //   getUrl: (url: string) => `https://proxy-service.example.com?url=${encodeURIComponent(url)}`
    // }
  ],
}

/**
 * Returns a proxied URL for media assets to avoid CORS issues
 *
 * @param url The original URL to proxy
 * @param mimeType The MIME type of the asset
 * @param options Optional configuration for proxying
 * @returns The proxied URL
 */
export function getProxiedUrl(
  url: string,
  mimeType?: string,
  options?: {
    proxyIndex?: number
    forceProxy?: boolean
  },
): string {
  // If proxy is disabled or URL is empty, return original
  if (!url || (!PROXY_CONFIG.enabled && !options?.forceProxy)) {
    return url
  }

  // Only proxy video URLs unless forced
  const isVideo = mimeType?.startsWith('video')
  if (!isVideo && !options?.forceProxy) {
    return url
  }

  // Get the preferred proxy from the list
  const proxyIndex = options?.proxyIndex ?? 0
  const proxy = PROXY_CONFIG.proxies[proxyIndex]

  // If we have a valid proxy, use it
  if (proxy) {
    return proxy.getUrl(url)
  }

  // Fallback to original URL if no proxy is available
  return url
}

/**
 * Tries the next proxy in the list if available
 *
 * @param url The original URL
 * @param mimeType The MIME type
 * @param currentProxyIndex The current proxy index that failed
 * @returns The next proxy URL or null if no more proxies are available
 */
export function getNextProxyUrl(
  url: string,
  mimeType?: string,
  currentProxyIndex: number = 0,
): string | null {
  // If we've exhausted all proxies, return null
  if (currentProxyIndex >= PROXY_CONFIG.proxies.length - 1) {
    return null
  }

  // Try the next proxy
  return getProxiedUrl(url, mimeType, {
    proxyIndex: currentProxyIndex + 1,
    forceProxy: true,
  })
}
