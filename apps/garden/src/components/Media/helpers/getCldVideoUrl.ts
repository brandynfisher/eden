import { constructCloudinaryUrl } from '@cloudinary-util/url-loader';
import type { VideoOptions, ConfigOptions, AnalyticsOptions } from '@cloudinary-util/url-loader';

import { getCloudinaryConfig, getCloudinaryAnalytics } from "../lib/cloudinary";
import { OG_IMAGE_HEIGHT, OG_IMAGE_WIDTH } from '@/components/Media/constants/sizes'

/**
 * getCldVideoUrl
 */

export type GetCldVideoUrlOptions = VideoOptions;
export type GetCldVideoUrlConfig = ConfigOptions;
export type GetCldVideoUrlAnalytics = AnalyticsOptions;

export function getCldVideoUrl(options: GetCldVideoUrlOptions, config?: GetCldVideoUrlConfig, analytics?: GetCldVideoUrlAnalytics) {
  return constructCloudinaryUrl({
    options: {
      assetType: 'video',
      format: 'auto:video',
      // quality: 'auto',
      ...options,
      width: options.width || OG_IMAGE_WIDTH,
      height: options.height || OG_IMAGE_HEIGHT,
    },
    config: getCloudinaryConfig(config),
    analytics: getCloudinaryAnalytics(analytics)
  });
}