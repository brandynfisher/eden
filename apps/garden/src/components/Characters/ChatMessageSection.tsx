import { ChatMessageGroup } from '@/lib/types'
import { Button, Input, Space } from 'antd'

const exampleMessageUser = 'What is the nature of consciousness?'
const exampleMessageBot =
  'Consciousness appears to me to be an emergent phenomenon. Just as pixels coalesce as an intricate image, individual neural or computational operations give rise to something as complex and awe-inspiring as conscious experience. Yet consciousness transcends mere computation.'

export const ChatMessageSection = ({
  messageGroups,
  setMessageGroups,
  showControls = true,
}: {
  messageGroups: ChatMessageGroup[]
  setMessageGroups: (messageGroups: ChatMessageGroup[]) => void
  showControls?: boolean
}) => {
  const onMessageChange = (groupIdx: number, idx: number, value: string) => {
    const newMessageGroups = [...messageGroups]
    newMessageGroups[groupIdx][idx].message = value
    setMessageGroups(newMessageGroups)
  }

  return (
    <>
      <div>
        {messageGroups.map((messages, groupIdx) => (
          <div key={groupIdx} className="mb-4">
            {messages.map((message, idx) => (
              <div key={idx} className="flex gap-2 mb-1">
                <div>
                  <Input
                    className="font-mono w-[95px] text-center"
                    value={message.sender}
                    disabled={true}
                  />
                </div>
                <div className="w-full">
                  <Input
                    className="font-mono"
                    value={message.message}
                    onChange={e =>
                      onMessageChange(groupIdx, idx, e.target.value)
                    }
                    placeholder={
                      message.sender === 'user'
                        ? exampleMessageUser
                        : exampleMessageBot
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        ))}
        {showControls && (
          <Space>
            <Button
              onClick={() => {
                setMessageGroups([
                  ...messageGroups,
                  [
                    { sender: 'user', message: '' },
                    { sender: 'char', message: '' },
                  ],
                ])
              }}
              className="font-mono bg-black text-white"
            >
              +
            </Button>
            {messageGroups && messageGroups.length ? (
              <Button
                onClick={() => {
                  setMessageGroups(messageGroups.slice(0, -1))
                }}
                className="font-mono "
                danger
              >
                -
              </Button>
            ) : null}
          </Space>
        )}
      </div>
    </>
  )
}

export default ChatMessageSection
