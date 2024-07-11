import FileUploader from '@/components/media/file-uploader'
import TypographyH4 from '@/components/ui/typography/TypographyH4'

const MediaSandboxPage = () => {
  return (
    <>
      <TypographyH4 className="mb-4">Cloudinary Upload</TypographyH4>
      <div className="flex gap-4">
        <FileUploader allowedFileTypes={['image']} />
        <FileUploader allowedFileTypes={['video']} />
      </div>
    </>
  )
}

export default MediaSandboxPage
