import { Button, Form, Input } from 'antd'
import axios from 'axios'
import { useRouter } from 'next/router'
import React from 'react'

import { handleAxiosError } from '../../lib/fetcher'

interface CharacterFormInputs {
  name: string
}

const CharacterForm = () => {
  const [form] = Form.useForm()
  const router = useRouter()

  const onFinish = async (values: CharacterFormInputs) => {
    try {
      const response = await axios.post('/api/agents/create', {
        ...values,
        capabilities: [],
      })
      const { agentId } = response.data
      router.push(`/agents/${agentId}`)
    } catch (error) {
      handleAxiosError(error)
    }
  }

  return (
    <>
      <h2 className="font-mono font-bold text-lg">Create Character</h2>
      <Form form={form} name="CharacterForm" onFinish={onFinish}>
        <Form.Item
          label={<div className="font-mono mt-2">Character Name</div>}
          labelCol={{ span: 24 }}
          name="name"
          rules={[
            { required: true, message: 'Please input a character name!' },
          ]}
        >
          <Input />
        </Form.Item>
        <Button
          className="font-mono bg-black text-white h-10"
          htmlType="submit"
        >
          Create Character
        </Button>
      </Form>
    </>
  )
}

export default CharacterForm
