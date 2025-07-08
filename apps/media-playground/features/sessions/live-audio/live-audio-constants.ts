export const LIVE_AUDIO_DEFAULTS = {
  liveInstructions: "Listen to the ongoing conversation and based on your persona, decide how to act. " +
    "\nRemember that making images and videos can take a while and so typically, you just " +
    "respond with ideas and suggestions that are relevant to the conversation. " +
    "\nBe concise and to the point and inject information the participants might not have thought of.",
  actionInterval: 30,
} as const

// Future: This function will be replaced with database lookup
export const getLiveAudioDefaults = async (): Promise<typeof LIVE_AUDIO_DEFAULTS> => {
  // TODO: Add database lookup here to get user's saved preferences
  // For now, return the hardcoded defaults
  return LIVE_AUDIO_DEFAULTS
}