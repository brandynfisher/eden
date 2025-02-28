'use client'

import { Progress } from '@/components/ui/progress'
import { TaskV2 } from '@edenlabs/eden-sdk'
import { useEffect, useState } from 'react'

// Static performance values based on historical data
const PERFORMANCE_DATA = {
  flux_trainer: 2,
  lora_trainer: 1,
}

interface Props {
  task: TaskV2
  maxTrainSteps?: number
}

const LoraTrainingProgress = ({ task, maxTrainSteps = 200 }: Props) => {
  const [progress, setProgress] = useState(0)
  const [timeElapsed, setTimeElapsed] = useState<string>('')

  useEffect(() => {
    const calculateProgress = () => {
      const startTime = new Date(task.updatedAt).getTime()
      const currentTime = Date.now()
      const elapsedTimeSeconds = (currentTime - startTime) / 1000

      if (elapsedTimeSeconds < 0) {
        setProgress(0)
        setTimeElapsed('Starting soon...')
        return
      }

      const elapsedMinutes = elapsedTimeSeconds / 60
      const minutes = Math.floor(elapsedMinutes)
      const seconds = Math.floor((elapsedMinutes - minutes) * 60)
      const elapsedText = `${minutes}m ${seconds}s elapsed`
      setTimeElapsed(elapsedText)

      let avgTimePerStep = 1
      if (task.tool === 'flux_trainer') {
        avgTimePerStep = PERFORMANCE_DATA.flux_trainer
      } else if (task.tool === 'lora_trainer') {
        avgTimePerStep = PERFORMANCE_DATA.lora_trainer
      }

      // Steps that should be completed by now
      const stepsCompleted = Math.min(
        Math.floor(elapsedTimeSeconds / avgTimePerStep),
        maxTrainSteps,
      )

      // Calculate raw progress percentage
      const rawProgressPercentage = (stepsCompleted / maxTrainSteps) * 100

      // Cap the visual progress at 95% until the task is completed
      const cappedProgressPercentage = Math.min(rawProgressPercentage, 95)
      setProgress(cappedProgressPercentage)
    }

    // Initial calculation
    calculateProgress()

    // Update every second
    const interval = setInterval(calculateProgress, 1000)

    return () => clearInterval(interval)
  }, [task.status, task.updatedAt, maxTrainSteps, task.tool])

  return (
    <div className="w-3/4 space-y-2">
      <Progress value={progress} className="h-2" />
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{timeElapsed}</span>
        <span>{progress.toFixed(1)}%</span>
      </div>
    </div>
  )
}

export default LoraTrainingProgress
