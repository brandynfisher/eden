import FormLabel from '@/components/Forms/FormLabel'
import { Form, Input } from 'antd'
import React from 'react'

const CharacterFormPro = () => {
  return (
    <div className="px-2 py-2">
      <Form.Item
        label={
          <FormLabel
            text="Knowledge"
            description="Add knowledge for your character"
          />
        }
        className="label-auto-height !mb-2"
        labelCol={{ span: 24 }}
        name="knowledge"
      >
        <Input.TextArea autoSize={{ minRows: 3 }} />
      </Form.Item>

      <Form.Item
        label={
          <FormLabel
            text="Knowledge Summary"
            description="Add a knowledge summary for your character"
          />
        }
        className="label-auto-height !mb-0"
        labelCol={{ span: 24 }}
        name="knowledgeSummary"
      >
        <Input.TextArea autoSize={{ minRows: 3 }} />
      </Form.Item>
    </div>
  )
}

export default CharacterFormPro
