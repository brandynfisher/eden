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
import { getFileTypeByMimeType } from '@/lib/files'
import { TaskV2Result } from '@edenlabs/eden-sdk'
import { ImageIcon, XIcon } from 'lucide-react'
import React from 'react'

type Props = {
  intermediateOutputs: TaskV2Result['intermediate_outputs']
}

export const IntermediateOutputsDialog = ({ intermediateOutputs }: Props) => {
  const totalArrayElements = intermediateOutputs
    ? Object.values(intermediateOutputs).reduce(
        (acc, arr) => acc + arr.length,
        0,
      )
    : 0

  return (
    <Dialog>
      <DialogTrigger asChild>
        <div
          title="View Intermediate Outputs"
          className="absolute z-10 right-2 bottom-2 bg-purple-600/60 hover:bg-purple-600 border border-purple-600 cursor-pointer text-shadow-sm shadow-popover rounded-md p-1 text-xs flex items-center"
        >
          <ImageIcon className="h-3 w-3 mr-1 drop-shadow-sm shadow-popover" />
          <div className="font-mono">+{totalArrayElements}</div>
        </div>
      </DialogTrigger>
      <DialogContentScrollable className="!max-h-fit p-4 md:p-8 my-4 mx-4 flex flex-col">
        <DialogHeader>
          <DialogTitle>Intermediate Outputs</DialogTitle>
          <DialogDescription>
            Controlnet preprocessor, masks, etc
          </DialogDescription>
        </DialogHeader>
        <LightboxGallery>
          <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
            {intermediateOutputs
              ? Object.entries(intermediateOutputs).map(output => (
                  <div key={output[0]}>
                    <div className="text-sm bg-secondary p-2 rounded-t-md">
                      {output[0]}
                    </div>
                    <div className="relative flex justify-center bg-muted-darker p-2 rounded-b-md">
                      {output[1].map((mediaResult, index) => (
                        <div key={`${mediaResult.url}_${index}`}>
                          {getFileTypeByMimeType(
                            mediaResult.mediaAttributes?.mimeType,
                          ) === 'audio' ? (
                            <div className="flex w-full h-full items-center justify-center min-h-64">
                              <audio src={mediaResult.url} controls={true} />
                            </div>
                          ) : (
                            <LightboxGalleryItem
                              className={'h-[calc(60vh_-_72.4px)]'}
                              forceRender={false}
                              unoptimized={true}
                              item={{
                                url: mediaResult.url,
                                thumbnail: mediaResult.url,
                                width: mediaResult.mediaAttributes?.width,
                                height: mediaResult.mediaAttributes?.height,
                              }}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              : null}
          </div>
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
