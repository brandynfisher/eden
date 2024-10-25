import LightboxGallery, {
  LightboxGalleryItem,
} from '@/components/media/lightbox-gallery'
import { Button } from '@/components/ui/button'
import { DialogContentScrollable } from '@/components/ui/custom/dialog-content-scrollable'
import {
  Dialog,
  DialogClose,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { TaskV2Result } from '@edenlabs/eden-sdk'
import { ImageIcon, XIcon } from 'lucide-react'
import React from 'react'

type Props = {
  result: TaskV2Result
}

export const IntermediateOutputsDialog = ({ result }: Props) => {
  const totalArrayElements =
    result && result.intermediateOutputs
      ? Object.values(result.intermediateOutputs).reduce(
          (acc, arr) => acc + arr.length,
          0,
        )
      : 0

  return (
    <Dialog>
      <DialogTrigger>
        <div
          title="View Intermediate Outputs"
          className="absolute right-2 bottom-2 bg-purple-600/80 hover:bg-purple-600 cursor-pointer drop-shadow rounded-md p-1 text-sm flex items-center"
        >
          <ImageIcon className="h-3 w-3 mr-1" />
          <div className="font-mono">+{totalArrayElements}</div>
        </div>
      </DialogTrigger>
      <DialogContentScrollable className="p-8 my-4 mx-4 flex flex-col">
        <DialogHeader>
          <DialogTitle>Intermediate Outputs</DialogTitle>
          <DialogDescription>
            Controlnet preprocessor, masks, etc
          </DialogDescription>
        </DialogHeader>
        <LightboxGallery>
          {result && result.intermediateOutputs
            ? Object.entries(result.intermediateOutputs).map(output => (
                <div key={output[0]}>
                  <div className="text-sm bg-secondary p-2 rounded-t-md">
                    {output[0]}
                  </div>
                  <div className="flex justify-center bg-muted-darker p-2 rounded-b-md">
                    {output[1].map((mediaResult, index) => (
                      <LightboxGalleryItem
                        key={`${mediaResult.filename}_${index}`}
                        forceRender={true}
                        item={{
                          url: getCloudfrontOriginalUrl(mediaResult.filename),
                          thumbnail: getCloudfrontOriginalUrl(
                            mediaResult.filename,
                          ),
                          width: mediaResult.mediaAttributes?.width,
                          height: mediaResult.mediaAttributes?.height,
                          duration:
                            mediaResult.mediaAttributes?.duration || undefined,
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))
            : null}
        </LightboxGallery>
        <DialogClose asChild>
          <Button
            className="absolute top-2 right-2"
            type="button"
            variant="ghost"
            size="icon"
          >
            <XIcon />
          </Button>
        </DialogClose>
      </DialogContentScrollable>
    </Dialog>
  )
}
