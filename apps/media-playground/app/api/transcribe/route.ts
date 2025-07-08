import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

export async function POST(request: NextRequest) {
  try {
    // Check if API key is available
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API key not configured' },
        { status: 500 },
      )
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    const formData = await request.formData()
    const audioFile = formData.get('audio') as File

    if (!audioFile) {
      return NextResponse.json(
        { success: false, error: 'No audio file provided' },
        { status: 400 },
      )
    }

    // Check if audio file is too small (likely silence)
    if (audioFile.size < 1000) {
      return NextResponse.json(
        { success: false, error: 'Audio file too small' },
        { status: 400 },
      )
    }

    const transcription = await openai.audio.transcriptions.create({
      file: audioFile, // Pass the File object directly
      model: 'gpt-4o-mini-transcribe',
      response_format: 'json',
    })

    return NextResponse.json({
      success: true,
      transcription: transcription.text,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Transcription error:', error)

    // Handle specific OpenAI errors
    if (error instanceof Error) {
      if (error.message.includes('rate_limit_exceeded')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Rate limit exceeded. Please try again later.',
          },
          { status: 429 },
        )
      }
      if (error.message.includes('insufficient_quota')) {
        return NextResponse.json(
          { success: false, error: 'Insufficient OpenAI quota' },
          { status: 402 },
        )
      }
    }

    return NextResponse.json(
      { success: false, error: 'Failed to transcribe audio' },
      { status: 500 },
    )
  }
}
