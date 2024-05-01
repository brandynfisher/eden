import FileUpload, { FileTypes } from '@/components/media/file-upload'
import TypographyH4 from '@/components/ui/typography/TypographyH4'

const MediaSandboxPage = () => {
  return (
    <>
      <TypographyH4 className="mb-4">Cloudinary Upload</TypographyH4>
      <div className="flex gap-4">
        <FileUpload allowedFileTypes={[FileTypes['Image']]}/>
        <FileUpload allowedFileTypes={[FileTypes['Video']]}/>
      </div>
    </>
  )
}

export default MediaSandboxPage
