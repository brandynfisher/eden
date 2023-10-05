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
  acceptedMimeTypes?: string
  onUploadInProgress?: (uploading: boolean) => void
}) => {
  const { message } = App.useApp()
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')

  const [fileList, setFileList] = useState<UploadFile[]>([])

  const isArray = Array.isArray(props.parameter.default)

  const [uploadIds, setUploadIds] = useState<string[]>([])

  useEffect(() => {
    if (!props.parameter.default) {
      return
    }

    const newUploadIds = isArray
      ? props.parameter.default
      : [props.parameter.default]
    const dummyFileList: UploadFile[] = newUploadIds.map(
      (newUploadId: string) => ({
        uid: newUploadId,
        name: newUploadId,
        status: 'done',
        url: '', // You need to provide a way to get the URL from the uploadId here
      }),
    )
    setFileList(dummyFileList)
    props.form.setFieldsValue({
      [props.parameter.name]: isArray ? newUploadIds : newUploadIds[0],
    })
    setUploadIds(newUploadIds)
  }, [props.parameter.default])

  const maxUploads = isArray ? props.parameter.maxLength || 3 : 1

  useEffect(() => {
    if (!props.onUploadInProgress) {
      return
    }

    if (!fileList || !fileList.length) {
      props.onUploadInProgress(false)
      return
    }

    const someUnfinished = fileList.some(
      fileListItem => fileListItem.percent !== 100,
    )

    props.onUploadInProgress(someUnfinished)
  }, [fileList])

  const handleChange = async (info: UploadChangeParam) => {
    if (info.file.status === 'error') {
      const fileList = [...info.fileList]
      fileList.pop()
      setFileList(fileList)
      props.form.setFieldsValue({
        [props.parameter.name]: isArray ? uploadIds : uploadIds[0],
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
      const newUploadIds = [...uploadIds, info.file.response.uploadId]
      props.form.setFieldsValue({
        [props.parameter.name]: isArray ? newUploadIds : newUploadIds[0],
      })
      setUploadIds(newUploadIds)

      message.destroy()
      message.success(
        <>
          <div>Uploaded successfully</div>
          <div className="mt-1 font-bold">
            <a href={info.file.response.fileUrl}>[ link ]</a>
          </div>
          <br />
          {info.file.response.fileUrl}
        </>,
        10000,
      )
    }
    if (info.file.status === 'removed') {
      const removedUploadId = info.file.response.uploadId
      const newUploadIds = uploadIds.filter(
        uploadId => uploadId !== removedUploadId,
      )
      props.form.setFieldsValue({
        [props.parameter.name]: isArray ? newUploadIds : newUploadIds[0],
      })
      setUploadIds(newUploadIds)
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
      <Row className=" flex-shrink-0 ">
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
            accept={props.acceptedMimeTypes ? props.acceptedMimeTypes : ''}
          >
            {fileList.length >= maxUploads ? null : (
              <div className="flex flex-shrink-0 p-2 px-4">
                <UploadOutlined />
                <div className="ml-1">Upload</div>
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
