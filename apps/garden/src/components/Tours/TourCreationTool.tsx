import { useLocalStorage } from '@mantine/hooks'
import { useEffect, useState } from 'react'
import Joyride, { CallBackProps, STATUS, Step } from 'react-joyride'

const TourCreationTool = () => {
  const [isMounted, setIsMounted] = useState(false)
  const [showTour, setShowTour] = useState(false)

  const [tourDismissed, setTourDismissed] = useLocalStorage<boolean>({
    key: 'tours::creation-tool-overview--dismissed',
    // defaultValue: false,
  })

  const tourSteps: Step[] = [
    {
      title: 'Creation Settings',
      content:
        "Here's where you configure settings for the currently selected generator",
      target: '[data-testid="creation-workspace-form"]',
      // placement: 'top',
      disableBeacon: true,
      // offset: -50,
    },
    {
      title: 'Generators',
      content: 'Click here to select from a list of generators',
      target: '[data-testid="generator-select-modal-trigger"] div',
      spotlightClicks: true,
    },
    {
      title: 'Timeline',
      content:
        'This is your creation timeline, recent tasks and creations will appear here',
      target: '[data-testid="creation-workspace-timeline"]',
      placementBeacon: 'top',
    },
    {
      title: 'Manna',
      content:
        'This is your current manna balance, click here to explore plans or get more manna',
      target: '[data-testid="manna-dropdown-button"]',
      spotlightClicks: true,
    },
  ]

  const handleTourDismissed = () => {
    // console.log('handleTourDismissed - tour dismissed at step', stepNumber)
    setShowTour(false)
    setTourDismissed(true)
  }

  const handleTourStart = () => {
    // console.log('handleTourStart')
    setShowTour(true)
    setTourDismissed(false)
  }

  const handleJoyrideCallback = (data: CallBackProps) => {
    // console.log(data)
    const { status } = data
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED]

    if (finishedStatuses.includes(status)) {
      handleTourDismissed()
    }
  }

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (isMounted && (typeof tourDismissed === 'undefined' || !tourDismissed)) {
      handleTourStart()
    }
  }, [isMounted, tourDismissed])

  if (!isMounted) {
    return null
  }

  return (
    <Joyride
      callback={handleJoyrideCallback}
      continuous
      hideCloseButton
      run={showTour}
      scrollToFirstStep
      showProgress
      showSkipButton
      steps={tourSteps}
      styles={{
        options: {
          zIndex: 50,
          arrowColor: 'rgb(215,215,215)',
          backgroundColor: 'rgb(215,215,215)',
          overlayColor: 'rgba(0, 0, 0, 0.8)',
          primaryColor: 'rgb(16, 185, 129)',
        },
      }}
    />
  )
}

export default TourCreationTool
