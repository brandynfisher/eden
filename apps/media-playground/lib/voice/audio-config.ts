/**
 * Shared audio configuration for microphone access
 *
 * This configuration prevents Android devices from switching to call mode (SCO/telephony mode)
 * by disabling audio processing features that trigger telephony optimization.
 */
export const SAFE_MICROPHONE_CONSTRAINTS: MediaTrackConstraints = {
  echoCancellation: false,
  noiseSuppression: false,
  autoGainControl: false,
  channelCount: 1,
  sampleRate: 48000,
  sampleSize: 16,
}
