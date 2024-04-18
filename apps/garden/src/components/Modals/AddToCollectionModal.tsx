'use client'

import Combobox from '@/components/Forms/Combobox'
import ModalTitle from '@/components/Modals/ModalTitle'
import { useCollections } from '@/hooks/useCollections'
import { handleAxiosError } from '@/lib/fetcher'
import { UserContext } from '@/providers/UserProvider'
import { Collection } from '@edenlabs/eden-sdk'
import { AddOutlined } from '@mui/icons-material'
import { TextField } from '@mui/material'
import Button from '@mui/material/Button'
import { App, Divider, Modal } from 'antd'
import axios from 'axios'
import React, { useContext, useState } from 'react'

const AddToCollectionModal = ({
  creationId,
  ...rest
}: {
  creationId: string
}) => {
  const { message } = App.useApp()
  const { user } = useContext(UserContext)
  const { collections, refetchCollections } = useCollections(
    user?._id,
    creationId,
  )
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState('')
  const [loading, setLoading] = useState(false)

  console.log({ collections })

  const handleCreationAdd = async (
    creationId: string,
    collection: Collection,
  ) => {
    message.destroy()
    try {
      await axios.post('/api/collections/add', {
        collectionId: collection._id,
        creationIds: [creationId],
      })
      message.success(`Creation added to ${collection.name}`)
    } catch (e) {
      handleAxiosError(e, message)
    }
  }

  const handleCreationRemove = async (
    creationId: string,
    collection: Collection,
  ) => {
    message.destroy()
    try {
      await axios.post('/api/collections/remove', {
        collectionId: collection._id,
        creationIds: [creationId],
      })
      message.success(`Creation removed from ${collection.name}`)
    } catch (e) {
      handleAxiosError(e, message)
    }
  }

  const handleItemChanged = async (collection: Collection) => {
    try {
      if (!collection.hasItem) {
        await handleCreationAdd(creationId, collection)
      } else {
        await handleCreationRemove(creationId, collection)
      }
      refetchCollections()
    } catch (e) {
      console.error('Failed to toggle collection', e)
    }
  }

  const handleNameInputChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    setNewName(ev.target.value)
  }

  const handleCreateNew = async () => {
    message.destroy()
    setLoading(true)
    try {
      const name = newName.trim()

      if (!name) {
        return
      }

      await axios.post('/api/collections/create', {
        name,
        creationIds: [creationId],
      })

      refetchCollections()
      message.success('Collection created successfully')
    } catch (e) {
      handleAxiosError(e, message)
    }
    setShowForm(false)
    setLoading(false)
  }

  return (
    <Modal
      {...rest}
      className="modal-small max-w-lg flex flex-col w-full items-center justify-center"
    >
      <ModalTitle title="Add to Collection" />
      <div className="pt-2">
        <Combobox
          items={collections}
          onItemChange={handleItemChanged}
          footer={
            <div className="mb-2 ml-2 mr-2">
              <Divider className="m-0 my-2" />
              {showForm ? (
                <div>
                  <TextField
                    autoFocus={true}
                    size="small"
                    id="standard-basic"
                    label="Name"
                    variant="outlined"
                    className="mt-2 mb-2 w-full"
                    onChange={handleNameInputChange}
                    value={newName}
                  />
                  <div className="flex justify-between flex-wrap mt-2">
                    <Button size="small" onClick={() => setShowForm(false)}>
                      Cancel
                    </Button>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={handleCreateNew}
                      disabled={loading || !newName}
                    >
                      Create
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => setShowForm(!showForm)}
                  className="flex gap-1 w-full"
                >
                  <AddOutlined /> New collection
                </Button>
              )}
            </div>
          }
        />
      </div>
    </Modal>
  )
}

export default AddToCollectionModal
