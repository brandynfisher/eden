import ParameterLabel from '@/components/Creation/CreationInterface/parameters/ParameterLabel'
import { truncateText } from '@/lib/string'
import { GeneratorParameter } from '@edenlabs/eden-sdk'
import FileUploadOutlined from '@mui/icons-material/FileUploadOutlined'
import { Form, FormInstance, Modal, Row, Upload, message } from 'antd'
import type { RcFile } from 'antd/es/upload'
import type { UploadChangeParam, UploadFile } from 'antd/es/upload/interface'
import React, { useEffect, useState } from 'react'

const { Dragger } = Upload

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
  compact?: boolean
}) => {
  const [messageApi, contextHolder] = message.useMessage()
  const showUploadInProgressMessage = async (messageKey: string) => {
    await messageApi.open({
      key: messageKey,
      type: 'loading',
      content: 'Uploading: ' + truncateText(messageKey, 20),
      duration: 0,
    })
  }

  const showUploadErrorMessage = async (
    messageKey: string,
    errorMessage: string,
  ) => {
    await messageApi.open({
      key: messageKey,
      type: 'error',
      content: (
        <div>
          <div>Upload error {truncateText(messageKey, 20)}</div>
          <div className="text-red-500">{errorMessage}</div>
        </div>
      ),
      duration: 3,
    })
  }

  const showUploadSuccessMessage = async (messageKey: string) => {
    await messageApi.open({
      key: messageKey,
      type: 'success',
      content: 'Upload success: ' + truncateText(messageKey, 20),
      duration: 3,
    })
  }

  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewImage, setPreviewImage] = useState('')
  const [previewTitle, setPreviewTitle] = useState('')
  const [fileList, setFileList] = useState<UploadFile[]>([])
  const [urls, setUrls] = useState<string[]>([])

  const isArray = Array.isArray(props.parameter.default)

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
    if (info.file.status === 'uploading') {
      showUploadInProgressMessage(info.file.name)
    }

    if (info.file.status === 'error') {
      const fileList = [...info.fileList]
      fileList.pop()
      setFileList(fileList)
      props.form.setFieldsValue({
        [props.parameter.name]: isArray ? urls : urls[0],
      })

      let errorMessage = info.file.response?.error || 'Unknown error occurred'
      if (errorMessage.startsWith('options.maxFileSize')) {
        errorMessage = 'file size limit exceeded (100mb)'
      }

      showUploadErrorMessage(info.file.name, errorMessage)
      return
    }

    setFileList(info.fileList)

    if (info.file.status === 'done' || info.file.status === 'success') {
      const newUrls = [...urls, info.file.response.fileUrl]
      props.form.setFieldsValue({
        [props.parameter.name]: isArray ? newUrls : newUrls[0],
      })
      setUrls(newUrls)
      showUploadSuccessMessage(info.file.name)
    }
    if (info.file.status === 'removed') {
      if (!info.file.response) return
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
      {contextHolder}
      <Row>
        <Form.Item
          className="mb-2 max-w-full w-full"
          initialValue={props.parameter.default}
          label={
            <ParameterLabel
              text={props.parameter.label}
              description={props.parameter.description}
            />
          }
          name={props.parameter.name}
          rules={[
            {
              required: props.parameter.isRequired,
              message: `${props.parameter.label} required`,
            },
          ]}
        >
          <Dragger
            name="file"
            action="/api/media"
            fileList={fileList}
            listType="picture"
            onChange={handleChange}
            accept={props.acceptedMimeTypes ? props.acceptedMimeTypes : ''}
            multiple={maxUploads > 1}
            maxCount={maxUploads}
            showUploadList={{ showDownloadIcon: true, showRemoveIcon: true }}
            onPreview={handlePreview}
          >
            <div className="flex gap-2 items-center justify-center px-2 text-gray-700 dark:text-gray-500 hover:!text-blue-500">
              <FileUploadOutlined />
              <div>Click here or drag files to upload</div>
              {/*{!props.compact ? (*/}
              {/*  <div className="ant-upload-hint text-xs text-gray-500 mt-2">*/}
              {/*    <strong>{props.acceptedMimeTypes}</strong>*/}
              {/*  </div>*/}
              {/*) : null}*/}
            </div>
          </Dragger>
        </Form.Item>
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
