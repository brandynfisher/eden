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
import { useState } from 'react'
import * as timeago from 'timeago.js'

type ConversationEntry = {
  message: string
  speaker: 'bot' | 'user'
  date: Date
  id?: string
}

const ChatScenarioUI = () => {
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
      await new Promise(resolve => setTimeout(resolve, 1000))
      setConversation(state => [
        ...state,
        {
          message: 'I am a bot',
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
          <ConversationHeader.Content userName="Single Agent Chat" />
        </ConversationHeader>
        <MessageList
          typingIndicator={
            botIsTyping ? (
              <TypingIndicator content="Pinecone is typing" />
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
                  sender={entry.speaker === 'bot' ? 'Pinecone' : 'You'}
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
