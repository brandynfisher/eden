import { SectionChatMockClient } from '@/features/landing/section-chat-mock-client'
import { getMultipleAgentsCached } from '@/lib/actions/agent'
import { siteConfig } from '@/lib/config'

export const AGENT_CONFIGS = [
  {
    id: siteConfig.featured.agents[0],
    // name: 'Eve',
    // description: 'Your creative AI companion for image generation and editing',
    greeting:
      "Hi! I'm Eve, your creative AI companion. What would you like to create today?",
    suggestions: [
      {
        label: 'What tools can you use?',
        prompt:
          'Can you list all the tools and capabilities you have access to?',
      },
      {
        label: 'Animate my logo',
        prompt:
          'I would like to animate my company logo. Can you help me with that?',
      },
      {
        label: 'Make sketches into art',
        prompt: 'I have a sketch, can you make it into an art piece?',
      },
      {
        label: 'Help me draft a character',
        prompt: 'I need help creating a character design. Can you assist me?',
      },
    ],
  },
  {
    id: siteConfig.featured.agents[1],
    // name: 'Abraham',
    // description: 'Your AI assistant for creative writing and storytelling',
    greeting:
      "Hello! I'm Abraham, ready to help you craft amazing stories and develop compelling characters.",
    suggestions: [
      {
        label: 'Write a story',
        prompt: 'Can you help me write a short story?',
      },
      {
        label: 'Character development',
        prompt: 'I need help developing a character for my story',
      },
    ],
  },
  {
    id: siteConfig.featured.agents[2],
    // name: 'VJ Master',
    // description: 'Your video creation and editing specialist',
    greeting:
      "Hey there! I'm VJ Master, ready to help you create amazing videos and visual effects.",
    suggestions: [
      {
        label: 'Create a video',
        prompt: 'I want to create a video from my images. Can you help?',
      },
      {
        label: 'Add effects',
        prompt: 'I need to add some special effects to my video',
      },
    ],
  },
  {
    id: siteConfig.featured.agents[3],
    // name: 'Verdelis',
    // description: 'Your AI art director for visual branding and design',
    greeting:
      "Welcome! I'm Verdelis, your AI art director. Let's create something beautiful together.",
    suggestions: [
      {
        label: 'Brand design',
        prompt: 'I need help creating a visual brand identity',
      },
      {
        label: 'Style guide',
        prompt: 'Can you help me create a style guide for my brand?',
      },
    ],
  },
]

export default async function SectionChatMock() {
  const agentIds = AGENT_CONFIGS.map(config => config.id)
  const agentData = await getMultipleAgentsCached(agentIds)

  // Ensure we have complete data for each agent
  const agentsWithData = AGENT_CONFIGS.map(config => {
    const fetchedData = agentData[config.id]
    return {
      ...fetchedData,
      greeting: config.greeting,
      suggestions: config.suggestions,
    }
  })

  return <SectionChatMockClient agents={agentsWithData} />
}
