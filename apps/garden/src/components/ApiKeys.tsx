import { useApiKeys } from '@/hooks/useApiKeys'
import { handleAxiosError } from '@/lib/fetcher'
import { UserContext } from '@/providers/UserProvider'
import { Button, Input, Space, Table } from 'antd'
import axios from 'axios'
import React, { useContext, useState } from 'react'

const ActionsButtons = ({
  apiKey,
  mutate,
}: {
  apiKey: string
  mutate: VoidFunction
}) => {
  const handleDeleteApiKey = async () => {
    try {
      await axios.post(`/api/apikeys/delete`, {
        apiKey,
      })
      mutate()
    } catch (error) {
      handleAxiosError(error)
    }
  }

  return (
    <Space>
      <Button className="font-mono" danger onClick={handleDeleteApiKey}>
        Delete
      </Button>
    </Space>
  )
}

const ApiKeys = () => {
  const { isAuthenticated } = useContext(UserContext)
  const { apiKeys, refetchApiKeys } = useApiKeys({ isAuthenticated })
  const [apiKeyCreating, setApiKeyCreating] = useState(false)
  const [note, setNote] = useState('')

  const handleCreateAPIKey = async () => {
    setApiKeyCreating(true)
    try {
      await axios.post('/api/apikeys/create', {
        note: note,
      })
      setApiKeyCreating(false)
      refetchApiKeys()
    } catch (error) {
      handleAxiosError(error)
    }
  }

  const columns = [
    {
      title: 'API Key',
      dataIndex: 'apiKey',
      key: 'apiKey',
    },
    {
      title: 'API Secret',
      dataIndex: 'apiSecret',
      key: 'apiSecret',
    },
    {
      title: 'Note',
      dataIndex: 'note',
      key: 'note',
    },
    {
      title: 'Date created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (dateCreated: string) => new Date(dateCreated).toLocaleString(),
    },
    {
      title: 'Actions',
      dataIndex: 'actions',
      key: 'actions',
    },
  ]

  const data = apiKeys?.map((apiKey, index) => ({
    ...apiKey,
    key: index,
    actions: <ActionsButtons apiKey={apiKey.apiKey} mutate={refetchApiKeys} />,
  }))

  return (
    <div>
      <h1>My API Keys</h1>
      <Table dataSource={data} columns={columns} />
      <h1>Create new key</h1>
      <Input
        placeholder="Note about this key"
        value={note}
        style={{ width: '50%', marginTop: 10, marginBottom: 10 }}
        onChange={e => setNote(e.target.value)}
      />
      <br />
      <Button
        className="font-mono bg-black text-white h-10"
        onClick={handleCreateAPIKey}
        disabled={apiKeyCreating}
        loading={apiKeyCreating}
      >
        Create new API key
      </Button>
    </div>
  )
}

export default ApiKeys
