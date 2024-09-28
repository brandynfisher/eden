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
    <div className="relative w-full my-4">
      {model.deleted ? (
        <div className="absolute inset-0 w-full h-full z-10 bg-accent/70 drop-shadow flex justify-center items-center">
          <div className="p-1 bg-destructive/50 text-destructive-foreground text-xs rounded-sm backdrop-blur-[2px]">
            deleted
          </div>
        </div>
      ) : null}
      <LightboxGallery>
        <LightboxGalleryItem
          className={cn([
            'lg:absolute lg:h-full',
            isModal
              ? 'max-h-[calc(100dvh_-_130px)]'
              : 'max-h-[calc(100dvh_-_230px)]',
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
