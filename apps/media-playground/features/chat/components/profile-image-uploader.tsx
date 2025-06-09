'use client'

import { Button } from '@/components/ui/button'
import { uploadFileToS3 } from '@/lib/files'
import { cn } from '@/lib/utils'
import axios from 'axios'
import { Loader2, Upload } from 'lucide-react'
import { FC, useRef, useState } from 'react'
import * as React from 'react'
import { toast } from 'sonner'

export const ProfileImageUploader: FC<{
  value: string | null | undefined
  onChange: (value: string) => void
}> = ({ value, onChange }) => {
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    setIsUploading(true)

    try {
      // Use the same upload mechanism as FileUploader
      const cancelSource = axios.CancelToken.source()
      const uploadedFile = await uploadFileToS3({
        file,
        onUploadProgress: () => {}, // We could add progress here if needed
        cancelSource,
      })

      if (uploadedFile && uploadedFile.fileUrl) {
        console.log('Upload successful, URL:', uploadedFile.fileUrl)
        onChange(uploadedFile.fileUrl)
        toast.success('Profile image uploaded successfully')
      } else {
        throw new Error('Upload failed - no file URL returned')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload image')
    } finally {
      setIsUploading(false)
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
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
    <div className="flex flex-col items-center space-y-4">
      <div
        onClick={!isUploading ? handleClick : undefined}
        onDrop={!isUploading ? handleDrop : undefined}
        onDragOver={!isUploading ? handleDragOver : undefined}
        onDragLeave={!isUploading ? handleDragLeave : undefined}
        className={cn(
          'relative w-32 h-32 rounded-full border-2 border-dashed border-gray-300 cursor-pointer transition-all duration-200 overflow-hidden group',
          isDragging && 'border-primary bg-primary/5',
          'hover:border-primary hover:bg-primary/5',
          isUploading && 'opacity-50 cursor-not-allowed',
        )}
      >
        {value ? (
          <img
            src={value}
            alt="Profile"
            className="w-full h-full object-cover"
            onError={e => {
              console.error('Image failed to load:', value)
              // Fallback to placeholder if image fails to load
              e.currentTarget.style.display = 'none'
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            {isUploading ? (
              <Loader2 className="w-8 h-8 mb-2 animate-spin" />
            ) : (
              <Upload className="w-8 h-8 mb-2" />
            )}
            <span className="text-sm font-medium">
              {isUploading ? 'Uploading...' : 'Upload'}
            </span>
          </div>
        )}
        {!isUploading && (
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Upload className="w-6 h-6 text-white" />
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
      <p className="text-sm text-muted-foreground text-center max-w-xs">
        {isUploading
          ? 'Uploading image...'
          : 'Click or drag to upload a profile image'}
      </p>
      {value && !isUploading && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={e => {
            e.stopPropagation()
            onChange('')
          }}
        >
          Remove
        </Button>
      )}
    </div>
  )
}
