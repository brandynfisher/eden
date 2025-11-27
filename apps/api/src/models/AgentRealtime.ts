import { AgentDocument } from './Agent'
import { Document, Schema, model } from 'mongoose'

// LLM model options for ElevenLabs
export type RealtimeLLM =
  | 'gpt-5'
  | 'gpt-5-mini'
  | 'gpt-5-nano'
  | 'gemini-2.5-flash-lite'
  | 'gemini-2.5-flash'
  | 'claude-sonnet-4-5'
  | 'claude-haiku-4-5'

export interface AgentRealtimeSchema {
  agent: AgentDocument['_id']
  // ElevenLabs agent ID override
  elevenlabs_agent_id?: string
  // Voice settings
  voice_id?: string
  // Language code (e.g., 'en', 'nl')
  language?: string
  // Custom greeting message
  first_message?: string
  // LLM settings
  llm_model?: RealtimeLLM
  temperature?: number
  max_tokens?: number
  // TTS settings
  tts_stability?: number
  tts_speed?: number
  tts_similarity_boost?: number
}

export interface AgentRealtimeDocument extends AgentRealtimeSchema, Document {}

const AgentRealtimeSchema = new Schema<AgentRealtimeDocument>(
  {
    agent: {
      type: Schema.Types.ObjectId,
      ref: 'users3',
      required: true,
      unique: true,
    },
    elevenlabs_agent_id: {
      type: String,
    },
    voice_id: {
      type: String,
    },
    language: {
      type: String,
      default: 'en',
    },
    first_message: {
      type: String,
    },
    llm_model: {
      type: String,
      enum: [
        'gpt-5',
        'gpt-5-mini',
        'gpt-5-nano',
        'gemini-2.5-flash-lite',
        'gemini-2.5-flash',
        'claude-sonnet-4-5',
        'claude-haiku-4-5',
      ],
      default: 'claude-sonnet-4-5',
    },
    temperature: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.7,
    },
    max_tokens: {
      type: Number,
      min: 1,
      max: 16384,
      default: 4096,
    },
    tts_stability: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.45,
    },
    tts_speed: {
      type: Number,
      min: 0,
      max: 1.2,
      default: 1.0,
    },
    tts_similarity_boost: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.25,
    },
  },
  {
    timestamps: true,
  },
)

// Index for querying by agent
AgentRealtimeSchema.index({ agent: 1 }, { unique: true })

export const AgentRealtime = model<AgentRealtimeDocument>(
  'agent_realtime',
  AgentRealtimeSchema,
)
