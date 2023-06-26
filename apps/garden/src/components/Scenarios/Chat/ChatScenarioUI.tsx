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
import { Character } from '@eden-labs/eden-sdk'
import axios from 'axios'
import { useState } from 'react'
import * as timeago from 'timeago.js'

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
      // dummy sleep
      const prompt = activeCharacter.capabilities?.find(
        capability => capability.type === 'chat',
      ).data.prompt as string
      const fmtPrompt = prompt.replace('{{recentMessage}}', text)
      const res = await axios.post(`/api/lm/complete`, { prompt: fmtPrompt })
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
    <MainContainer responsive>
      <ChatContainer>
        <ConversationHeader>
          <ConversationHeader.Actions></ConversationHeader.Actions>
          <ConversationHeader.Content userName="Single Character Chat" />
        </ConversationHeader>
        <MessageList
          typingIndicator={
            botIsTyping ? (
              <TypingIndicator content={`${activeCharacter.name} is typing`} />
            ) : null
          }
          style={{ height: 'calc(100vh - 200px)' }}
        >
          {conversation.map((entry, index) => {
            return (
              <Message
                key={index}
                style={{ width: '90%' }}
                model={{
                  type: 'custom',
                  sender: entry.speaker,
                  position: 'single',
                  direction: entry.speaker === 'bot' ? 'incoming' : 'outgoing',
                }}
              >
                <Message.CustomContent>{entry.message}</Message.CustomContent>
                <Message.Footer
                  sentTime={timeago.format(entry.date)}
                  sender={
                    entry.speaker === 'bot' ? activeCharacter.name : 'You'
                  }
                />
              </Message>
            )
          })}
        </MessageList>
        <MessageInput
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
