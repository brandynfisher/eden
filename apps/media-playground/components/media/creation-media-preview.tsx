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
      className="relative w-full"
      style={{ aspectRatio: creation?.mediaAttributes?.aspectRatio || 1 }}
    >
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
    </div>
  )
}

export default CreationMediaPreview
