'use client'

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { usePlayer } from '@/contexts/player-context'
import { useState } from 'react'

interface SettingsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function formatDuration(seconds: number): string {
  if (seconds < 60) {
    const secs = Math.round(seconds)
    return `${secs} ${secs === 1 ? 'second' : 'seconds'}`
  } else if (seconds < 3600) {
    const mins = Math.round(seconds / 60)
    return `${mins} ${mins === 1 ? 'minute' : 'minutes'}`
  } else {
    const hours = Math.floor(seconds / 3600)
    const remainingMinutes = Math.round((seconds % 3600) / 60)

    if (remainingMinutes === 0) {
      return `${hours} ${hours === 1 ? 'hour' : 'hours'}`
    }

    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ${remainingMinutes} ${
      remainingMinutes === 1 ? 'minute' : 'minutes'
    }`
  }
}

function sliderToTime(x: number): number {
  const tMin = 5 // 5 seconds
  const tMax = 3 * 3600 // 3 hours = 10800 seconds
  return tMin * Math.pow(tMax / tMin, x)
}

function timeToSlider(seconds: number): number {
  const tMin = 5
  const tMax = 3 * 3600
  return Math.log(seconds / tMin) / Math.log(tMax / tMin)
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const {
    setIsMuted,
    mediaDuration,
    setMediaDuration,
    applyDurationToVideos,
    setApplyDurationToVideos,
    setShowSettings,
    hasVideos,
  } = usePlayer()

  const [sliderValue, setSliderValue] = useState(timeToSlider(mediaDuration))
  const [soundEnabled, setSoundEnabled] = useState(false)

  const handleSliderChange = (value: number[]) => {
    const newValue = value[0]
    setSliderValue(newValue)
    setMediaDuration(sliderToTime(newValue))
  }

  const handleStart = () => {
    setIsMuted(!soundEnabled)
    setShowSettings(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="gap-6">
        <AlertDialogHeader>
          <AlertDialogTitle>Slideshow Settings</AlertDialogTitle>
          <AlertDialogDescription>
            Configure your slideshow preferences
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-medium">Media Duration</h3>
            <div className="space-y-2">
              <Slider
                value={[sliderValue]}
                onValueChange={handleSliderChange}
                max={1}
                step={0.01}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Media will display for{' '}
                {formatDuration(sliderToTime(sliderValue))}
              </p>
            </div>
            {hasVideos && (
              <div className="flex items-center space-x-2 pt-2">
                <Switch
                  checked={applyDurationToVideos}
                  onCheckedChange={setApplyDurationToVideos}
                  id="video-duration"
                />
                <Label htmlFor="video-duration">Apply duration to videos</Label>
              </div>
            )}
          </div>

          {hasVideos && (
            <div className="space-y-4">
              <h3 className="font-medium">Sound Settings</h3>
              <AlertDialogDescription>
                Would you like to enable sound for all videos in this
                collection? You can change this later in the player.
              </AlertDialogDescription>
              <div className="flex items-center space-x-2">
                <Switch
                  checked={soundEnabled}
                  onCheckedChange={setSoundEnabled}
                  id="sound-mode"
                />
                <Label htmlFor="sound-mode">Enable Sound</Label>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Go Back
          </Button>
          <Button onClick={handleStart} className="gap-2">
            Start Slideshow
          </Button>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  )
}
