import { PlusOutlined } from '@ant-design/icons'
import { GeneratorParameter } from '@eden-labs/eden-sdk/dist/responses/GeneratorsGetResponse'
import { Form, FormInstance, Row } from 'antd'
import { Modal, Upload } from 'antd'
import type { RcFile } from 'antd/es/upload'
import type { UploadChangeParam, UploadFile } from 'antd/es/upload/interface'
import React, { useState } from 'react'
import { toast } from 'react-toastify'

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
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')

  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [urls, setUrls] = useState<string[]>([])

  const isArray = Array.isArray(props.parameter.default)
  const maxUploads = isArray ? props.parameter.maxLength || 3 : 1

  const handleChange = (info: UploadChangeParam) => {
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
      toast.error(
        `${info.file.name} failed to upload because: ${errorMessage}.`,
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
      toast.success(
        <>
          Uploaded successfully <a href={info.file.response.fileUrl}>[link]</a>.
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
          style={{ marginBottom: 5 }}
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
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>Upload</div>
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
        <img alt="example" style={{ width: '100%' }} src={previewImage} />
      </Modal>
    </>
  )
}

export default UploadParameter
