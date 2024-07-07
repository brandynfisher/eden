import { useApiKeys } from '@/hooks/useApiKeys'
import { handleAxiosError } from '@/lib/fetcher'
import { UserContext } from '@/providers/UserProvider'
import { useClipboard } from '@mantine/hooks'
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import { App, Breakpoint, Button, Card, Input, Space, Table } from 'antd'
import axios from 'axios'
import React, { useContext, useState } from 'react'

const ActionsButtons = ({
  apiKey,
  mutate,
}: {
  apiKey: string
  mutate: VoidFunction
}) => {
  const { message } = App.useApp()
  const handleDeleteApiKey = async (ev: React.MouseEvent) => {
    if (ev) {
      ev.stopPropagation()
    }

    try {
      await axios.post(`/api/apikeys/delete`, {
        apiKey,
      })
      mutate()
    } catch (error) {
      handleAxiosError(error, message)
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
  const { message } = App.useApp()
  const { copied, copy } = useClipboard({ timeout: 750 })

  const handleCopyClick = async () => {
    await copy(text)

    message.destroy()
    message.success(`Copied ${name} to clipboard!`)
  }

  return (
    <Button className="flex cursor-copy" onClick={handleCopyClick} title={text}>
      <div className="truncate" style={{ maxWidth: '80px' }}>
        {text}
      </div>
      <div className="ml-auto">
        {copied ? <CheckCircleOutlineIcon /> : <ContentCopyIcon />}
      </div>
    </Button>
  )
}

const ApiKeys = () => {
  const { isAuthenticated, maybeAuthenticate } = useContext(UserContext)
  const { apiKeys, refetchApiKeys } = useApiKeys({ isAuthenticated })
  const [apiKeyCreating, setApiKeyCreating] = useState(false)
  const [note, setNote] = useState('')
  const { message } = App.useApp()

  const handleCreateAPIKey = async () => {
    if (!(await maybeAuthenticate())) return
    setApiKeyCreating(true)
    try {
      await axios.post('/api/apikeys/create', {
        note: note,
      })
      setApiKeyCreating(false)
      refetchApiKeys()
    } catch (error) {
      handleAxiosError(error, message)
    }
  }

  const columns = [
    // {
    //   title: 'API Key',
    //   dataIndex: 'apiKey',
    //   key: 'apiKey',
    //   width: 120,
    //   render: (val: string) => <TruncatedField name="API Key" text={val} />,
    // },
    // {
    //   title: 'API Secret',
    //   dataIndex: 'apiSecret',
    //   key: 'apiSecret',
    //   width: 120,
    //   render: (val: string) => <TruncatedField name="API Secret" text={val} />,
    // },
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
      {isAuthenticated ? (
        <Table
          dataSource={data}
          columns={columns}
          size="middle"
          expandable={{
            expandRowByClick: true,
            expandedRowRender: record => (
              <div className="flex gap-2 flex-wrap">
                <div className="flex gap-2 items-center w-full">
                  <div className="w-full">API Key</div>
                  <TruncatedField name="API Key" text={record.apiKey} />
                </div>
                {/*<div className="flex gap-2 items-center w-full">*/}
                {/*  <div className="w-full">API Secret</div>*/}
                {/*  <TruncatedField name="API Secret" text={record.apiSecret} />*/}
                {/*</div>*/}
              </div>
            ),
          }}
        />
      ) : (
        <Card>Not signed in.</Card>
      )}

      <div className="mt-4">
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
