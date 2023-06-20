import { handleAxiosError } from '@/lib/fetcher'
import { UserContext } from '@/providers/UserProvider'
import { Creation } from '@eden-labs/eden-sdk'
import { Button, Form, Input, List, Modal } from 'antd'
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
    setLoading(true)
    try {
      const { name, description } = await form.validateFields()
      await axios.post('/api/collections/create', {
        name,
        description,
        creationIds: [creation._id],
      })
    } catch (e) {
      handleAxiosError(e)
    }
    setLoading(false)
    setOpen(false)
  }

  const defaultCollection =
    collections && collections.filter(c => c.isDefaultCollection)[0]

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
    <Modal
      title={title}
      open={open}
      onCancel={() => setOpen(false)}
      footer={footer}
    >
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
          <h2 className="text-lg font-semibold">Quick Save</h2>
          <div className="rounded p-2 mb-4">
            {defaultCollection?.name || 'Default Collection'}
          </div>
          <h2 className="text-lg font-semibold">My collections</h2>
          <List
            dataSource={collections}
            renderItem={collection => (
              <List.Item>
                <div className="rounded p-2 mb-2">{collection.name}</div>
              </List.Item>
            )}
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
