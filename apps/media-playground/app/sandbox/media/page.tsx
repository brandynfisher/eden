import ImageTest from '@/components/image-test'
import FileUpload from '@/components/media/file-upload'
import TypographyH4 from '@/components/ui/typography/TypographyH4'

const MediaSandboxPage = () => {
  return (
    <>
      <TypographyH4 className="mb-4">Cloudinary Upload</TypographyH4>
      <div className="flex gap-4">
        <FileUpload allowedFileTypes={['image']} />
        <FileUpload allowedFileTypes={['video']} />
      </div>
      <ImageTest />
    </>
  )
}

export default MediaSandboxPage
