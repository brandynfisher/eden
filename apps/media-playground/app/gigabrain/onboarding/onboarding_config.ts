export const onboardingChatConfig = {
  agent_name: 'gigabrain_builder',
  min_n_turns: 2,
  initial_user_message:
    'Can you explain me the first step to setting up a gigabrain plz?',
}

export const onboardingPrompts = {
  persona_extraction: `Extract the core personality traits and characteristics from the following conversation. {CONVERSATION}`,
  summary_extraction: `Generate a comprehensive summary of the agent's purpose and capabilities based on this conversation. {CONVERSATION}`,
  memory_instructions: `Based on the following conversation, generate instructions for how this agent should store and recall memories. {CONVERSATION}`,
}
