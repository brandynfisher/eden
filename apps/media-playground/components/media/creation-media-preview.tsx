import LightboxGallery, {
  LightboxGalleryItem,
} from '@/components/media/lightbox-gallery'
import { CreationV2 } from '@edenlabs/eden-sdk'
import React from 'react'

type Props = {
  creation: CreationV2
}

const CreationMediaPreview = ({ creation }: Props) => {
  return (
    <div
      className="relative w-full my-4"
      style={{ aspectRatio: creation?.mediaAttributes?.aspectRatio || 1 }}
    >
      {creation.mediaAttributes?.type === 'audio' ? (
        <div className="flex w-full h-full items-center justify-center">
          <audio src={creation.url} controls={true} />
        </div>
      ) : (
        <LightboxGallery>
          <LightboxGalleryItem
            className="w-full h-full max-h-full"
            forceRender={true}
            item={{
              url: creation.url,
              thumbnail: creation.thumbnail,
              width: creation.mediaAttributes?.width,
              height: creation.mediaAttributes?.height,
              duration: creation.mediaAttributes?.duration || undefined,
            }}
          />
        </LightboxGallery>
      )}
    </div>
  )
}

export default CreationMediaPreview
