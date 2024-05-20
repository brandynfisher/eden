import { getCloudinaryConfig } from '../lib/cloudinary'
import { constructCloudinaryUrl } from '@cloudinary-util/url-loader'
import type { ConfigOptions, ImageOptions } from '@cloudinary-util/url-loader'

/**
 * getCldImageUrl
 */

export type GetCldImageUrlOptions = ImageOptions
export type GetCldImageUrlConfig = ConfigOptions

export function getCldImageUrl(
  options: GetCldImageUrlOptions,
  config?: GetCldImageUrlConfig,
) {
  return constructCloudinaryUrl({
    options,
    config: getCloudinaryConfig(config),
    // analytics: getCloudinaryAnalytics(analytics)
    analytics: false,
  })
}
