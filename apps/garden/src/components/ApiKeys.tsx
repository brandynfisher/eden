import { useApiKeys } from '@/hooks/useApiKeys'
import { requireAuth } from '@/lib/auth'
import { handleAxiosError } from '@/lib/fetcher'
import { UserContext } from '@/providers/UserProvider'
import { CheckCircleOutlined, CopyOutlined } from '@ant-design/icons'
import { useClipboard } from '@mantine/hooks'
import { Breakpoint, Button, Input, Space, Table } from 'antd'
import axios from 'axios'
import React, { useContext, useState } from 'react'
import { toast } from 'react-toastify'

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

const TruncatedField = ({ name, text }: { name: string; text: string }) => {
  const { copied, copy } = useClipboard({ timeout: 750 })

  const handleCopyClick = async () => {
    await copy(text)
    toast.success(`Copied ${name} to clipboard!`)
  }

  return (
    <Button className="flex" onClick={handleCopyClick} title={text}>
      <div className="truncate" style={{ maxWidth: '80px' }}>
        {text}
      </div>
      <div className="ml-auto">
        {copied ? <CheckCircleOutlined /> : <CopyOutlined />}
      </div>
    </Button>
  )
}

const ApiKeys = () => {
  const { isAuthenticated, authenticate } = useContext(UserContext)
  const { apiKeys, refetchApiKeys } = useApiKeys({ isAuthenticated })
  const [apiKeyCreating, setApiKeyCreating] = useState(false)
  const [note, setNote] = useState('')

  const handleCreateAPIKey = async () => {
    if (!isAuthenticated) {
      await requireAuth(authenticate)
      return
    }
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
      width: 120,
      render: (val: string) => <TruncatedField name="API Key" text={val} />,
    },
    {
      title: 'API Secret',
      dataIndex: 'apiSecret',
      key: 'apiSecret',
      width: 120,
      render: (val: string) => <TruncatedField name="API Secret" text={val} />,
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
      responsive: ['lg'] as Breakpoint[],
    },
    {
      title: 'Actions',
      dataIndex: 'actions',
      key: 'actions',
      width: 100,
    },
  ]

  const data = apiKeys?.map((apiKey, index) => ({
    ...apiKey,
    key: index,
    actions: <ActionsButtons apiKey={apiKey.apiKey} mutate={refetchApiKeys} />,
  }))

  return (
    <div className="mb-4">
      <h2 className="text-xl">API Keys</h2>
      <Table dataSource={data} columns={columns} size="middle" />

      <div>
        <h3 className="text-l">Create new API key</h3>
        <Input
          placeholder="Note about this key"
          value={note}
          style={{ width: '50%', marginTop: 10, marginBottom: 10 }}
          onChange={e => setNote(e.target.value)}
        />
      </div>

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
