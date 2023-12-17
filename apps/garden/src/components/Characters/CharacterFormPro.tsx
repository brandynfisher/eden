import FormLabel from '@/components/Forms/FormLabel'
import { Form, Input } from 'antd'
import React from 'react'

const CharacterFormPro = () => {
  return (
    <>
      <Form.Item
        label={
          <FormLabel
            text="Knowledge"
            description="Add knowledge for your character"
          />
        }
        className="label-auto-height"
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
        className="label-auto-height"
        labelCol={{ span: 24 }}
        name="knowledgeSummary"
      >
        <Input.TextArea autoSize={{ minRows: 3 }} />
      </Form.Item>
    </>
  )
}

export default CharacterFormPro
