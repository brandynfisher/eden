import {
  OG_IMAGE_HEIGHT,
  OG_IMAGE_WIDTH,
} from '@/components/Media/constants/sizes'

export const getAspectRatio = (
  width: number | undefined,
  height: number | undefined,
) => {
  return height && width ? (height / width) * 100 : 100
}

/**
 * Calculates dimensions of a media item with respect to its aspect ratio
 */
export const getLimitedMediaDimensions = (
  mediaWidth: number,
  mediaHeight: number,
) => {
  const LIMIT_LANDSCAPE = 1920
  const LIMIT_PORTRAIT = 1350
  const LIMIT_SQUARE = 1080
  // Verify mediaAttributes and its properties exist and throw error if not

  let width = mediaWidth || OG_IMAGE_WIDTH
  let height = mediaHeight || OG_IMAGE_HEIGHT

  if (!width || !height) {
    throw new Error('mediaAttributes cannot be undefined')
  }

  // Validate width and height are positive
  if (width <= 0 || height <= 0) {
    throw new Error('width and height must be positive')
  }

  let aspectRatio = width / height

  // Define aspect types based on aspectRatio. Using a small delta for floating point comparison
  const isLandscape = aspectRatio > 1.01 // landscape if width > height
  const isSquare = Math.abs(aspectRatio - 1) < 0.01 // square if width ~= height
  const isPortrait = aspectRatio < 0.99 // portrait if height > width

  // Calculate dimensions based on aspect type (landscape, portrait, square), bounded by defined constraints
  if (isLandscape) {
    width = Math.min(width, LIMIT_LANDSCAPE)
    height = Math.min(height, width / aspectRatio)
  } else if (isPortrait) {
    height = Math.min(height, LIMIT_PORTRAIT)
    width = Math.min(width, height * aspectRatio)
  } else if (isSquare) {
    width = height = Math.min(width, LIMIT_SQUARE)
  }

  return { width, height }
}
