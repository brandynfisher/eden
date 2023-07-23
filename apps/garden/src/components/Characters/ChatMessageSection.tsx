import { ChatMessageGroup } from '@/lib/types'
import { Button, Col, Input, Row, Space } from 'antd'

export const ChatMessageSection = ({
  messageGroups,
  setMessageGroups,
  showControls = true,
}: {
  messageGroups: ChatMessageGroup[]
  setMessageGroups: (messageGroups: ChatMessageGroup[]) => void
  showControls?: boolean
}) => {
  const onMessageSenderChange = (
    groupIdx: number,
    idx: number,
    value: string,
  ) => {
    const newMessageGroups = [...messageGroups]
    newMessageGroups[groupIdx][idx].sender = value
    setMessageGroups(newMessageGroups)
  }

  const onMessageChange = (groupIdx: number, idx: number, value: string) => {
    const newMessageGroups = [...messageGroups]
    newMessageGroups[groupIdx][idx].message = value
    setMessageGroups(newMessageGroups)
  }

  return (
    <>
      <div className="mb-4">
        {messageGroups.map((messages, groupIdx) => (
          <div key={groupIdx}>
            {messages.map((message, idx) => (
              <Row key={idx}>
                <Col span={4}>
                  <Input
                    className="font-mono"
                    value={message.sender}
                    onChange={e =>
                      onMessageSenderChange(groupIdx, idx, e.target.value)
                    }
                  />
                </Col>
                <Col span={20}>
                  <Input
                    className="font-mono"
                    value={message.message}
                    onChange={e =>
                      onMessageChange(groupIdx, idx, e.target.value)
                    }
                  />
                </Col>
              </Row>
            ))}
            <div style={{ height: '1rem' }} />
          </div>
        ))}
        {showControls && (
          <Space>
            <Button
              onClick={() => {
                setMessageGroups([
                  ...messageGroups,
                  [
                    { sender: '{{user}}', message: '' },
                    { sender: '{{character}}', message: '' },
                  ],
                ])
              }}
              className="font-mono bg-black text-white"
            >
              +
            </Button>
            <Button
              onClick={() => {
                setMessageGroups(messageGroups.slice(0, -1))
              }}
              className="font-mono "
              danger
            >
              -
            </Button>
          </Space>
        )}
      </div>
    </>
  )
}

export default ChatMessageSection
