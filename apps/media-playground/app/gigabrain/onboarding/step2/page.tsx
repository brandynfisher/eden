'use client'

import { useOnboardingStore } from '../chat/store'
import { OnboardingLayout } from '../components/onboarding-layout'
import { ProfileImageUploader } from '@/features/sessions/profile-image-uploader'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function OnboardingStep2Page() {
  const router = useRouter()
  const sessionId = useOnboardingStore(state => state.sessionId)
  const profileImageUrl = useOnboardingStore(state => state.profileImageUrl)
  const setProfileImageUrl = useOnboardingStore(
    state => state.setProfileImageUrl,
  )

  useEffect(() => {
    if (!sessionId) {
      // Redirect back to chat if no session exists
      router.push('/gigabrain/onboarding/chat')
    }
  }, [sessionId, router])

  if (!sessionId) {
    return null
  }

  const handleImageChange = (url: string) => {
    setProfileImageUrl(url)
  }

  return (
    <OnboardingLayout
      currentStep={2}
      totalSteps={4}
      canContinue={!!profileImageUrl}
      previousRoute={`/gigabrain/onboarding/chat/${sessionId}`}
      nextRoute="/gigabrain/onboarding/step3"
    >
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-black/60 rounded-xl p-8 border border-yellow-400/20 backdrop-blur-sm">
            <h3 className="text-2xl font-bold text-yellow-400 mb-4">
              Setup your visual knowledge
            </h3>
            <p className="text-gray-300 mb-6">
              Upload a profile picture for your Gigabrain. This will help your
              community recognize and connect with their collective mind.
            </p>

            {/* Profile Image Upload */}
            <div className="flex justify-center py-8">
              <ProfileImageUploader
                value={profileImageUrl}
                onChange={handleImageChange}
              />
            </div>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  )
}
