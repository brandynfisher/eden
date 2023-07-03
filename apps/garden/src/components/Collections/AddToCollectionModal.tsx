import { handleAxiosError } from '@/lib/fetcher'
import { UserContext } from '@/providers/UserProvider'
import { Collection, Creation } from '@eden-labs/eden-sdk'
import { useHover } from '@mantine/hooks'
import { App, Button, Form, Input, List, Modal } from 'antd'
import axios from 'axios'
import React, { useContext, useState } from 'react'

const AddToCollectionModal = ({
  open,
  setOpen,
  creation,
}: {
  open: boolean
  setOpen: (open: boolean) => void
  creation: Creation
}) => {
  const { message } = App.useApp()
  const { collections } = useContext(UserContext)
  const [isCreating, setIsCreating] = useState(false)
  const [loading, setLoading] = useState(false)
  const [form] = Form.useForm()

  const handleCreateNew = () => {
    setIsCreating(true)
  }

  const handleCancelNew = () => {
    setIsCreating(false)
  }

  const handleOk = async () => {
    message.destroy()
    setLoading(true)
    try {
      const { name, description } = await form.validateFields()
      await axios.post('/api/collections/create', {
        name,
        description,
        creationIds: [creation._id],
      })

      message.success('Collection created successfully')
    } catch (e) {
      handleAxiosError(e, message)
    }
    form.resetFields()
    setIsCreating(false)
    setLoading(false)
    setOpen(false)
  }

  const onCancel = () => {
    form.resetFields()
    setIsCreating(false)
    setLoading(false)
    setOpen(false)
  }

  const handleSave = async (collection: Collection) => {
    message.destroy()
    try {
      await axios.post('/api/collections/add', {
        collectionId: collection._id,
        creationIds: [creation._id],
      })
      message.success('Creation saved successfully')
    } catch (e) {
      handleAxiosError(e, message)
    }
    setOpen(false)
  }

  const nonDefaultCollections =
    collections &&
    collections.filter(collection => !collection.isDefaultCollection)

  const footer = isCreating
    ? [
        <Button key="back" onClick={handleCancelNew}>
          Back
        </Button>,
        <Button
          key="submit"
          type="primary"
          loading={loading}
          onClick={handleOk}
        >
          Submit
        </Button>,
      ]
    : null

  const title = isCreating ? 'Create New Collection' : 'Add to Collection'

  return (
    <Modal title={title} open={open} onCancel={onCancel} footer={footer}>
      {isCreating ? (
        <Form form={form} layout="vertical">
          <Form.Item
            label="Collection Name"
            name="name"
            rules={[
              {
                required: true,
                message: 'Please input a collection name',
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Collection Description"
            name="description"
            rules={[
              {
                required: true,
                message: 'Please input a collection description',
              },
            ]}
          >
            <Input />
          </Form.Item>
        </Form>
      ) : (
        <div className="overflow-y-auto max-h-80">
          <List
            dataSource={nonDefaultCollections}
            renderItem={collection => {
              const { hovered, ref } = useHover()

              return (
                <List.Item
                  onClick={() => handleSave(collection)}
                  style={{
                    cursor: 'pointer',
                    backgroundColor: hovered ? '#f0f0f0' : 'transparent',
                  }}
                  ref={ref}
                >
                  <div className="rounded p-2 mb-2">{collection.name}</div>
                </List.Item>
              )
            }}
          />
          <button
            className="w-full bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
            onClick={handleCreateNew}
          >
            Create new Collection
          </button>
        </div>
      )}
    </Modal>
  )
}

export default AddToCollectionModal
