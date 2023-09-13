import { ChatMessageGroup } from '@/lib/types'
import { Button, Input, Space } from 'antd'

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
