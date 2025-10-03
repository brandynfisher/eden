'use client'

import { useOnboardingStore } from '../chat/store'
import { OnboardingLayout } from '../components/onboarding-layout'
import { AutosizeTextarea } from '@/components/ui/custom/autoresize-textarea'
import { Input } from '@/components/ui/input'
import { SlickUsernamePicker } from '@/components/ui/slick-username-picker'
import { ProfileImageUploader } from '@/features/sessions/profile-image-uploader'
import { uploadFileToS3 } from '@/lib/files'
import { cn } from '@/lib/utils'
import axios from 'axios'
import { Loader2, Upload, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import React, { useEffect, useRef, useState } from 'react'

export default function OnboardingIdentityPage() {
  const router = useRouter()
  const sessionId = useOnboardingStore(state => state.sessionId)
  const profileImageUrl = useOnboardingStore(state => state.profileImageUrl)
  const name = useOnboardingStore(state => state.name)
  const username = useOnboardingStore(state => state.username)
  const referenceImages = useOnboardingStore(state => state.referenceImages)
  const setProfileImageUrl = useOnboardingStore(
    state => state.setProfileImageUrl,
  )
  const setName = useOnboardingStore(state => state.setName)
  const setUsername = useOnboardingStore(state => state.setUsername)
  const setReferenceImages = useOnboardingStore(
    state => state.setReferenceImages,
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
    allReferenceImagesValid

  return (
    <OnboardingLayout
      currentStep={2}
      totalSteps={4}
      canContinue={canContinue}
      previousRoute={`/gigabrain/onboarding/chat/${sessionId}`}
      nextRoute="/gigabrain/onboarding/step3"
    >
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="bg-black/60 rounded-xl p-8 border border-yellow-400/20 backdrop-blur-sm">
            <h3 className="text-2xl font-bold text-yellow-400 mb-4">
              Your agents Identity
            </h3>

            {/* Profile Section */}
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              {/* Profile Image Upload */}
              <div className="flex-shrink-0 mx-auto lg:mx-0">
                <div className="text-center mb-3">
                  <h4 className="text-sm font-medium text-gray-300">
                    Profile picture
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
                    <span className="text-yellow-400 ml-1">*</span>
                  </label>
                  <Input
                    type="text"
                    placeholder="Agent display name"
                    value={name}
                    onChange={e => setName(e.target.value.slice(0, 100))}
                    className="bg-black/40 border-yellow-400/30 text-white placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400/20"
                  />
                </div>

                {/* Username Field */}
                <div className="space-y-2">
                  <label className="text-base font-medium text-gray-300">
                    Username
                    <span className="text-yellow-400 ml-1">*</span>
                  </label>
                  <div className="[&_input]:bg-black/40 [&_input]:border-yellow-400/30 [&_input]:text-white [&_input]:placeholder:text-gray-500 [&_input]:focus:border-yellow-400 [&_input]:focus:ring-yellow-400/20 [&_button]:border-yellow-400/30 [&_button]:text-yellow-400 [&_button]:hover:bg-yellow-400/10">
                    <SlickUsernamePicker
                      value={username}
                      onChange={setUsername}
                      displayName={name}
                      autoGenerateOnDisplayNameChange={true}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Visual Knowledge Section */}
          <div className="bg-black/60 rounded-xl p-8 border border-yellow-400/20 backdrop-blur-sm">
            <h3 className="text-2xl font-bold text-yellow-400 mb-2">
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

// Reference Image Card Component
function ReferenceImageCard({
  imageUrl,
  description,
  onImageChange,
  onDescriptionChange,
  onRemove,
  showRemove = true,
}: {
  imageUrl: string
  description: string
  onImageChange: (url: string) => void
  onDescriptionChange: (description: string) => void
  onRemove: () => void
  showRemove?: boolean
}) {
  const [isUploading, setIsUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      return
    }

    setIsUploading(true)

    try {
      const cancelSource = axios.CancelToken.source()
      const uploadedFile = await uploadFileToS3({
        file,
        onUploadProgress: () => {},
        cancelSource,
      })

      if (uploadedFile && uploadedFile.fileUrl) {
        onImageChange(uploadedFile.fileUrl)
      }
    } catch (error) {
      console.error('Upload error:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click()
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileChange(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 items-start">
      {/* Image Upload Area */}
      <div className="relative flex-shrink-0 mx-auto lg:mx-0">
        <div
          onClick={handleClick}
          onDrop={!isUploading ? handleDrop : undefined}
          onDragOver={!isUploading ? handleDragOver : undefined}
          onDragLeave={!isUploading ? handleDragLeave : undefined}
          className={cn(
            'relative w-40 h-40 rounded-lg border-2 border-dashed cursor-pointer transition-all duration-200 overflow-hidden group',
            isDragging
              ? 'border-yellow-400 bg-yellow-400/10'
              : 'border-yellow-400/30 bg-black/40',
            'hover:border-yellow-400 hover:bg-yellow-400/5',
            isUploading && 'opacity-50 cursor-not-allowed',
          )}
        >
          {imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt="Reference"
                className="w-full h-full object-cover"
              />
              {!isUploading && (
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Upload className="w-6 h-6 text-white" />
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              {isUploading ? (
                <Loader2 className="w-8 h-8 text-yellow-400 animate-spin" />
              ) : (
                <>
                  <Upload className="w-8 h-8 text-yellow-400/60 mb-2" />
                  <span className="text-xs text-gray-400">Upload image</span>
                </>
              )}
            </div>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) handleFileChange(file)
          }}
          className="hidden"
          disabled={isUploading}
        />

        {/* Remove button */}
        {showRemove && imageUrl && (
          <button
            onClick={onRemove}
            className="absolute -top-2 -right-2 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-full p-1 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Description Field */}
      <div className="flex-1 w-full space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-300">
            Description
            {imageUrl && <span className="text-yellow-400 ml-1">*</span>}
          </label>
          <span className="text-xs text-gray-500">
            {(description || '').length}/200
          </span>
        </div>
        <AutosizeTextarea
          placeholder="Describe what's in this image and when the agent should use/reference it."
          value={description}
          onChange={e => {
            const newValue = e.target.value.slice(0, 200)
            onDescriptionChange(newValue)
          }}
          className="bg-black/40 border-yellow-400/30 text-white placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400/20 min-h-[80px]"
          disabled={!imageUrl}
        />
      </div>
    </div>
  )
}
