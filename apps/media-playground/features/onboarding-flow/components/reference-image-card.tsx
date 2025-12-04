'use client'

import { AutosizeTextarea } from '@/components/ui/custom/autoresize-textarea'
import { uploadFileToS3 } from '@/lib/files'
import { cn } from '@/lib/utils'
import axios from 'axios'
import { Loader2, Upload, X } from 'lucide-react'
import React, { useRef, useState } from 'react'

interface ReferenceImageCardProps {
  imageUrl: string
  description: string
  onImageChange: (url: string) => void
  onDescriptionChange: (description: string) => void
  onRemove: () => void
  showRemove?: boolean
}

export function ReferenceImageCard({
  imageUrl,
  description,
  onImageChange,
  onDescriptionChange,
  onRemove,
  showRemove = true,
}: ReferenceImageCardProps) {
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
          className={cn(
            'border-yellow-400/30 text-white placeholder:text-gray-500 focus:border-yellow-400 focus:ring-yellow-400/20 min-h-[80px]',
            !imageUrl
              ? 'bg-gray-800/40 opacity-50 cursor-not-allowed'
              : 'bg-black/40',
          )}
          disabled={!imageUrl}
        />
      </div>
    </div>
  )
}
