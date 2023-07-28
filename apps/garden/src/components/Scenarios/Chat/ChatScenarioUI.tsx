import CharacterAvatar from '@/components/Characters/CharacterAvatar'
import { useCreator } from '@/hooks/useCreator'
import { compilePrompt } from '@/lib/chat'
import { timeAgo } from '@/lib/time'
import { ChatMessage } from '@/lib/types'
import { UserContext } from '@/providers/UserProvider'
import { RobotOutlined } from '@ant-design/icons'
import {
  Avatar,
  ChatContainer,
  ConversationHeader,
  MainContainer,
  Message,
  MessageInput,
  MessageList,
  TypingIndicator,
} from '@chatscope/chat-ui-kit-react'
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css'
import { Character } from '@edenlabs/eden-sdk'
import axios from 'axios'
import { useContext, useState } from 'react'

type ConversationEntry = {
  message: string
  speaker: 'bot' | 'user'
  date: Date
  id?: string
}

const ChatScenarioUI = ({
  activeCharacter,
}: {
  activeCharacter: Character
}) => {
  const { isAuthenticated, address } = useContext(UserContext)
  const { creator } = useCreator(isAuthenticated && address ? address : null)

  const [text, setText] = useState('')
  const [conversation, setConversation] = useState<ConversationEntry[]>(
    activeCharacter.greeting
      ? [
          {
            message: activeCharacter.greeting,
            speaker: 'bot',
            date: new Date(),
          },
        ]
      : [],
  )
  const [botIsTyping, setBotIsTyping] = useState(false)

  const submit = async () => {
    setConversation(state => [
      ...state,
      {
        message: text,
        speaker: 'user',
        date: new Date(),
      },
    ])
    try {
      setBotIsTyping(true)
      const recentMessage: ChatMessage = {
        sender: '{{user}}',
        message: text,
      }
      const prompt = compilePrompt(
        activeCharacter.name,
        recentMessage,
        activeCharacter.description,
        activeCharacter.dialogue,
      )
      const res = await axios.post(`/api/lm/complete`, { prompt })
      const completion = res.data.completion as string
      setConversation(state => [
        ...state,
        {
          message: completion.trim(),
          speaker: 'bot',
          date: new Date(),
        },
      ])
    } catch (error) {
      console.error('Error submitting message:', error)
    } finally {
      setBotIsTyping(false)
    }
    setText('')
  }

  if (!creator) {
    return <div>not logged in</div>
  }

  return (
    <MainContainer
      responsive
      className="dark:!bg-gray-800 !border-none rounded-lg overflow-hidden"
    >
      <ChatContainer className="!bg-gray-200 dark:!bg-gray-800 !border-none rounded-lg overflow-hidden max-h-[calc(100vh_-_223px)]">
        <ConversationHeader className="!bg-gray-200 dark:!bg-gray-800 !px-4 !py-4 !border-b-0">
          {/*<ConversationHeader.Actions className="!bg-gray-100 dark:!bg-gray-800"></ConversationHeader.Actions>*/}
          <ConversationHeader.Content
            className="!bg-gray-200 dark:!bg-gray-800"
            userName={
              <div className="!bg-gray-200 dark:!bg-gray-800 dark:!text-gray-200 text-sm flex justify-between items-center flex-wrap">
                <div className="flex items-center gap-2">
                  <CharacterAvatar
                    id={activeCharacter.id}
                    name={activeCharacter.name}
                    imageUri={activeCharacter.avatarImageUri}
                    size={'small'}
                  />
                  <div>{activeCharacter.name}</div>
                </div>

                <div className="font-normal dark:text-gray-400">
                  Single Character Chat
                </div>
              </div>
            }
          />
        </ConversationHeader>
        <MessageList
          autoScrollToBottom={true}
          className="!py-2 !bg-gray-50 dark:!bg-gray-900 !border-y !border-y-gray-300 dark:!border-y-gray-700 !border-solid !border-l-0 !border-r-0 !pl-[0.4em]"
          typingIndicator={
            botIsTyping ? (
              <TypingIndicator
                className="!px-4 !py-2 !bg-gray-100 dark:!bg-gray-700 !border-solid !border-t !border-t-gray-200 dark:!border-t-gray-600 !right-0 !border-l-0 !border-r-0 !border-b-0"
                content={`${activeCharacter.name} is typing`}
              />
            ) : null
          }
        >
          {conversation.map((entry, index) => {
            const isBotSpeaking = entry.speaker === 'bot'

            return (
              <Message
                key={index}
                model={{
                  type: 'custom',
                  sender: entry.speaker,
                  position: 'single',
                  direction: isBotSpeaking ? 'incoming' : 'outgoing',
                }}
              >
                <Avatar>
                  {isBotSpeaking ? (
                    <CharacterAvatar
                      id={activeCharacter.id}
                      name={activeCharacter.name}
                      imageUri={activeCharacter.avatarImageUri}
                      size={'small'}
                    />
                  ) : (
                    <CharacterAvatar
                      id={creator?.userId}
                      name={creator?.username || creator?.userId}
                      imageUri={creator.profileImageUri}
                      size={'small'}
                    />
                  )}
                </Avatar>
                <Message.Header
                  className={`!m-0 ${
                    isBotSpeaking ? '!justify-start' : '!justify-end'
                  }`}
                >
                  <div className="text-gray-700 dark:text-gray-400 mb-2">
                    {isBotSpeaking ? (
                      <div className="flex gap-2 items-center">
                        <div>{activeCharacter.name}</div>
                        <div
                          title="Character Generated Response"
                          className="flex items-center cursor-pointer"
                        >
                          <RobotOutlined />
                        </div>
                      </div>
                    ) : (
                      'You'
                    )}
                  </div>
                </Message.Header>
                <Message.CustomContent
                  className={`dark:text-gray-300 px-2 py-1 rounded-bl-lg rounded-br-lg ${
                    isBotSpeaking
                      ? 'bg-blue-200 dark:!bg-indigo-900  rounded-tr-lg'
                      : 'bg-gray-300 dark:!bg-gray-800 rounded-tl-lg'
                  }`}
                >
                  {entry.message}
                </Message.CustomContent>
                <Message.Footer className="!mt-0">
                  <div className="flex gap-2 items-center mt-2 text-gray-500">
                    <div>{timeAgo(entry.date)}</div>
                  </div>
                </Message.Footer>
              </Message>
            )
          })}
        </MessageList>
        <MessageInput
          className="!bg-gray-200 dark:!bg-gray-800 !py-4 !border-t-0"
          placeholder="Type your message here..."
          onSend={submit}
          onChange={(e, text) => {
            setText(text)
          }}
          sendButton={true}
          autoFocus
          attachButton={false}
        />
      </ChatContainer>
    </MainContainer>
  )
}

export default ChatScenarioUI
