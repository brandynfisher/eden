export enum CapabilityType {
  CHAT = 'chat',
}

export interface ChatMessage {
  sender: string
  message: string
}

export type ChatMessageGroup = ChatMessage[]
