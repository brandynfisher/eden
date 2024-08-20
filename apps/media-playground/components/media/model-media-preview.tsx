import LightboxGallery, {
  LightboxGalleryItem,
} from '@/components/media/lightbox-gallery'
import { ModelV2 } from '@edenlabs/eden-sdk'
import React from 'react'

type Props = {
  model: ModelV2
}

const ModelMediaPreview = ({ model }: Props) => {
  return (
    <div className="relative w-full my-4" style={{ aspectRatio: 1 }}>
      <LightboxGallery>
        <LightboxGalleryItem
          className="w-full h-full max-h-full"
          forceRender={true}
          item={{
            url: model.thumbnail,
            thumbnail: model.thumbnail,
            width: 1024,
            height: 1024,
            duration: undefined,
          }}
        />
      </LightboxGallery>
    </div>
  )
}

export default ModelMediaPreview
