import ChatMessageSection from '@/components/Characters/ChatMessageSection'
import FormLabel from '@/components/Forms/FormLabel'
import { ChatMessageGroup } from '@/lib/types'
import { Form, Input } from 'antd'
import React from 'react'

const CharacterFormPro = ({
  messageGroups,
  setMessageGroups,
}: {
  messageGroups: ChatMessageGroup[]
  setMessageGroups: (messageGroups: ChatMessageGroup[]) => void
}) => {
  return (
    <>
      <Form.Item
        label={
          <FormLabel
            text="Example Messages"
            description="Add sample dialogs to further refine the personality of your character"
          />
        }
        className="label-auto-height"
        labelCol={{ span: 24 }}
        name="messages"
      >
        <ChatMessageSection
          messageGroups={messageGroups}
          setMessageGroups={setMessageGroups}
        />
      </Form.Item>

      <Form.Item
        label={
          <FormLabel
            text="Documentation"
            description="Add documentation for your character"
          />
        }
        className="label-auto-height"
        labelCol={{ span: 24 }}
        name="logosDocumentation"
      >
        <Input.TextArea autoSize={{ minRows: 3 }} />
      </Form.Item>

      <Form.Item
        label={
          <FormLabel
            text="Documentation Prompt"
            description="Add a documentation prompt for your character"
          />
        }
        className="label-auto-height"
        labelCol={{ span: 24 }}
        name="logosDocumentationPrompt"
      >
        <Input.TextArea autoSize={{ minRows: 3 }} />
      </Form.Item>

      <Form.Item
        label={
          <FormLabel
            text="Creator Prompt"
            description="Add a creator prompt for your character"
          />
        }
        className="label-auto-height"
        labelCol={{ span: 24 }}
        name="logosCreatorPrompt"
      >
        <Input.TextArea autoSize={{ minRows: 3 }} />
      </Form.Item>

      <Form.Item
        label={
          <FormLabel
            text="Router Prompt"
            description="Add a router prompt for your character"
          />
        }
        className="label-auto-height"
        labelCol={{ span: 24 }}
        name="logosRouterPrompt"
      >
        <Input.TextArea autoSize={{ minRows: 3 }} />
      </Form.Item>
    </>
  )
}

export default CharacterFormPro
