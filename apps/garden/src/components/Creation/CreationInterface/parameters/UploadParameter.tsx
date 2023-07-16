import { UploadOutlined } from '@ant-design/icons'
import { GeneratorParameter } from '@edenlabs/eden-sdk'
import { App, Form, FormInstance, Row } from 'antd'
import { Modal, Upload } from 'antd'
import type { RcFile } from 'antd/es/upload'
import type { UploadChangeParam, UploadFile } from 'antd/es/upload/interface'
import React, { useEffect, useState } from 'react'

const getBase64 = (file: RcFile): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = error => reject(error)
  })

const UploadParameter = (props: {
  form: FormInstance
  parameter: GeneratorParameter
}) => {
  const { message } = App.useApp()
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')

  const [fileList, setFileList] = useState<UploadFile[]>([])

  const isArray = Array.isArray(props.parameter.default)

  const [urls, setUrls] = useState<string[]>([])

  useEffect(() => {
    if (!props.parameter.default) {
      return
    }

    const newUrls = isArray
      ? props.parameter.default
      : [props.parameter.default]
    const dummyFileList: UploadFile[] = newUrls.map((newUrl: string) => ({
      name: newUrl,
      preview: newUrl,
      percent: 100,
      response: { fileUrl: newUrl },
      thumbUrl: newUrl,
      type: 'image/jpeg',
    }))
    setFileList(dummyFileList)
    props.form.setFieldsValue({
      [props.parameter.name]: isArray ? newUrls : newUrls[0],
    })
    setUrls(newUrls)
  }, [props.parameter.default])

  const maxUploads = isArray ? props.parameter.maxLength || 3 : 1

  const handleChange = async (info: UploadChangeParam) => {
    if (info.file.status === 'error') {
      const fileList = [...info.fileList]
      fileList.pop()
      setFileList(fileList)
      props.form.setFieldsValue({
        [props.parameter.name]: isArray ? urls : urls[0],
      })
      let errorMessage = info.file.response?.error || 'Unknown error occurred'
      if (errorMessage.startsWith('options.maxFileSize')) {
        errorMessage = '20MB file size limit exceeded'
      }

      message.destroy()
      message.error(
        <>
          <div>{`${info.file.name} failed to upload`}</div>
          <div className="mt-1 font-bold">{errorMessage}</div>
        </>,
      )

      return
    }
    setFileList(info.fileList)
    if (info.file.status === 'done') {
      const newUrls = [...urls, info.file.response.fileUrl]
      props.form.setFieldsValue({
        [props.parameter.name]: isArray ? newUrls : newUrls[0],
      })
      setUrls(newUrls)

      message.destroy()
      message.success(
        <>
          <div>Uploaded successfully</div>
          <div className="mt-1 font-bold">
            <a href={info.file.response.fileUrl}>[link]</a>
          </div>
        </>,
      )
    }
    if (info.file.status === 'removed') {
      const removedUrl = info.file.response.fileUrl
      const newUrls = urls.filter(url => url !== removedUrl)
      props.form.setFieldsValue({
        [props.parameter.name]: isArray ? newUrls : newUrls[0],
      })
      setUrls(newUrls)
    }
  }

  const handlePreview = async (file: UploadFile) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as RcFile)
    }
    setPreviewImage(file.url || (file.preview as string))
    setPreviewOpen(true)
    setPreviewTitle(
      file.name || file.url!.substring(file.url!.lastIndexOf('/') + 1),
    )
  }

  return (
    <>
      <Row>
        <Form.Item
          className="mb-2"
          initialValue={props.parameter.default}
          label={props.parameter.label}
          name={props.parameter.name}
          rules={[
            {
              required: props.parameter.isRequired,
              message: `${props.parameter.label} required`,
            },
          ]}
        >
          <Upload
            name="file"
            action="/api/media"
            listType="picture-card"
            fileList={fileList}
            onChange={handleChange}
            onPreview={handlePreview}
          >
            {fileList.length >= maxUploads ? null : (
              <div className="flex p-2 px-4">
                <UploadOutlined />
                <div className="ml-1">Upload File</div>
              </div>
            )}
          </Upload>
        </Form.Item>
      </Row>
      <Row>
        <span style={{ color: 'gray' }}>{props.parameter.description}</span>
      </Row>
      <Modal
        open={previewOpen}
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewOpen(false)}
      >
        <img alt="example" className="w-full" src={previewImage} />
      </Modal>
    </>
  )
}

export default UploadParameter
