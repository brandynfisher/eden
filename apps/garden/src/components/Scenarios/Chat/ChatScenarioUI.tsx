import CharacterAvatar from '@/components/Characters/CharacterAvatar'
import { compilePrompt } from '@/lib/chat'
import { timeAgo } from '@/lib/time'
import { ChatMessage } from '@/lib/types'
import {
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
import { useState } from 'react'

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
  const [text, setText] = useState('')
  const [conversation, setConversation] = useState<ConversationEntry[]>([])
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

  return (
    <MainContainer
      responsive
      className="dark:!bg-gray-800 !border-none rounded-lg overflow-hidden"
    >
      <ChatContainer className="!bg-gray-200 dark:!bg-gray-800 !border-none rounded-lg overflow-hidden">
        <ConversationHeader className="!bg-gray-200 dark:!bg-gray-800 !px-4 !py-4 !border-b-0">
          {/*<ConversationHeader.Actions className="!bg-gray-100 dark:!bg-gray-800"></ConversationHeader.Actions>*/}
          <ConversationHeader.Content
            className="!bg-gray-200 dark:!bg-gray-800"
            userName={
              <div className="!bg-gray-200 dark:!bg-gray-800 dark:!text-gray-200 text-sm flex justify-between items-center flex-wrap">
                <div className="flex items-center gap-2">
                  <CharacterAvatar character={activeCharacter} size={'small'} />
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
            return (
              <Message
                key={index}
                model={{
                  type: 'custom',
                  sender: entry.speaker,
                  position: 'single',
                  direction: entry.speaker === 'bot' ? 'incoming' : 'outgoing',
                }}
              >
                <Message.CustomContent>{entry.message}</Message.CustomContent>
                <Message.Footer
                  sentTime={timeAgo(entry.date)}
                  sender={
                    entry.speaker === 'bot' ? activeCharacter.name : 'You'
                  }
                />
              </Message>
            )
          })}
        </MessageList>
        <MessageInput
          className="!bg-gray-200 dark:!bg-gray-800 !py-4 !border-t-0"
          placeholder="Type message here"
          onSend={submit}
          onChange={(e, text) => {
            setText(text)
          }}
          sendButton={true}
          autoFocus
        />
      </ChatContainer>
    </MainContainer>
  )
}

export default ChatScenarioUI
