'use client'

import { OnboardingConfig, OnboardingStore } from '../types'
import { OnboardingLayout } from './onboarding-layout'
import { ReferenceImageCard } from './reference-image-card'
import { Input } from '@/components/ui/input'
import { SlickUsernamePicker } from '@/components/ui/slick-username-picker'
import { ProfileImageUploader } from '@/features/sessions/profile-image-uploader'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface IdentityPageProps {
  config: OnboardingConfig
  useStore: OnboardingStore
}

export function IdentityPage({ config, useStore }: IdentityPageProps) {
  const router = useRouter()
  const sessionId = useStore(state => state.sessionId)
  const profileImageUrl = useStore(state => state.profileImageUrl)
  const name = useStore(state => state.name)
  const username = useStore(state => state.username)
  const referenceImages = useStore(state => state.referenceImages)
  const setProfileImageUrl = useStore(state => state.setProfileImageUrl)
  const setName = useStore(state => state.setName)
  const setUsername = useStore(state => state.setUsername)
  const setReferenceImages = useStore(state => state.setReferenceImages)
  const [usernameStatus, setUsernameStatus] = useState<
    'available' | 'taken' | 'invalid' | 'checking' | null
  >(null)

  useEffect(() => {
    if (!sessionId) {
      // Redirect back to chat if no session exists
      router.push(`${config.routes.base}/chat`)
    }
  }, [sessionId, router, config.routes.base])

  if (!sessionId) {
    return null
  }

  const handleImageChange = (url: string) => {
    setProfileImageUrl(url)
  }

  const handleReferenceImageChange = (index: number, imageUrl: string) => {
    const updated = [...referenceImages]
    updated[index] = { ...updated[index], imageUrl }
    setReferenceImages(updated)
  }

  const handleReferenceDescriptionChange = (
    index: number,
    description: string,
  ) => {
    const updated = [...referenceImages]
    updated[index] = { ...updated[index], description }
    setReferenceImages(updated)
  }

  const handleRemoveReferenceImage = (index: number) => {
    const updated = referenceImages.filter((_, i) => i !== index)
    setReferenceImages(updated)
  }

  // Check if all reference images with an imageUrl also have a description
  const allReferenceImagesValid = referenceImages.every(
    img => !img.imageUrl || (img.description && img.description.trim()),
  )

  const canContinue =
    !!profileImageUrl &&
    !!name.trim() &&
    !!username.trim() &&
    usernameStatus === 'available' &&
    allReferenceImagesValid

  const identityTitle = config.identityTitle || 'Your agents Identity'

  return (
    <OnboardingLayout
      currentStep={2}
      totalSteps={3}
      canContinue={canContinue}
      previousRoute={`${config.routes.base}/chat/${sessionId}`}
      nextRoute={`${config.routes.base}/finish`}
    >
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-black/60 rounded-xl p-8 border border-violet-400/20 backdrop-blur-sm">
            <h3 className="text-2xl font-bold text-violet-400 mb-4">
              {identityTitle}
            </h3>

            {/* Profile Section */}
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Profile Image Upload */}
              <div className="flex-shrink-0 mx-auto lg:mx-0">
                <div className="text-center mb-3">
                  <h4 className="text-sm font-medium text-gray-300">
                    Profile picture
                    <span className="text-violet-400 ml-1">*</span>
                  </h4>
                </div>
                <ProfileImageUploader
                  value={profileImageUrl}
                  onChange={handleImageChange}
                />
              </div>

              {/* Name and Username Fields */}
              <div className="flex-1 space-y-5 w-full">
                {/* Name Field */}
                <div className="space-y-2">
                  <label className="text-base font-medium text-gray-300">
                    Name
                    <span className="text-violet-400 ml-1">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Agent display name"
                    value={name}
                    onChange={e => setName(e.target.value.slice(0, 100))}
                    className="bg-black/40 border-violet-400/30 text-white placeholder:text-gray-500 focus:border-violet-400 focus:ring-violet-400/20"
                  />
                </div>

                {/* Username Field */}
                <div className="space-y-2">
                  <label className="text-base font-medium text-gray-300">
                    Username
                    <span className="text-violet-400 ml-1">*</span>
                  </label>
                  <div className="[&_input]:bg-black/40 [&_input]:border-violet-400/30 [&_input]:text-white [&_input]:placeholder:text-gray-500 [&_input]:focus:border-violet-400 [&_input]:focus:ring-violet-400/20 [&_button]:border-violet-400/30 [&_button]:text-violet-400 [&_button]:hover:bg-violet-400/10">
                    <SlickUsernamePicker
                      value={username}
                      onChange={setUsername}
                      displayName={name}
                      autoGenerateOnDisplayNameChange={true}
                      onStatusChange={setUsernameStatus}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Knowledge Section */}
          <div className="bg-black/60 rounded-xl p-8 border border-violet-400/20 backdrop-blur-sm">
            <h3 className="text-2xl font-bold text-violet-400 mb-2">
              Add visual knowledge (optional)
            </h3>
            <p className="text-gray-400 text-sm mb-6">
              Upload reference images to help your agent understand & use visual
              objects, styles, logos, ... You can always add more later.
            </p>

            <div className="space-y-4">
              {/* Existing reference images */}
              {referenceImages.map((refImg, index) => (
                <ReferenceImageCard
                  key={index}
                  imageUrl={refImg.imageUrl}
                  description={refImg.description}
                  onImageChange={url => handleReferenceImageChange(index, url)}
                  onDescriptionChange={desc =>
                    handleReferenceDescriptionChange(index, desc)
                  }
                  onRemove={() => handleRemoveReferenceImage(index)}
                />
              ))}

              {/* Add new reference image card if last one has an image */}
              {(referenceImages.length === 0 ||
                referenceImages[referenceImages.length - 1]?.imageUrl) && (
                <ReferenceImageCard
                  imageUrl=""
                  description=""
                  onImageChange={url =>
                    handleReferenceImageChange(referenceImages.length, url)
                  }
                  onDescriptionChange={desc =>
                    handleReferenceDescriptionChange(
                      referenceImages.length,
                      desc,
                    )
                  }
                  onRemove={() => {}}
                  showRemove={false}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  )
}
