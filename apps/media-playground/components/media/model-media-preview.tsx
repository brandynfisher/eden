import LightboxGallery, {
  LightboxGalleryItem,
} from '@/components/media/lightbox-gallery'
import { cn } from '@/lib/utils'
import { ModelV2 } from '@edenlabs/eden-sdk'
import React from 'react'

type Props = {
  model: ModelV2
  isModal?: boolean
}

const ModelMediaPreview = ({ model, isModal }: Props) => {
  return (
    <div className="relative w-full my-4" style={{ aspectRatio: 1 }}>
      <LightboxGallery>
        <LightboxGalleryItem
          // className="w-full h-full max-h-full"
          className={cn([
            'md:absolute md:h-full',
            isModal ? 'h-[calc(100vh_-_112px)]' : 'h-[calc(100vh_-_176px)]',
          ])}
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
