import CreationWorkspace from '@/components/Creation/CreationInterface/CreationWorkspace'
import TestGeneratorInterface from '@/components/Creation/CreationInterface/TestGeneratorInterface'
import LoadingIndicator from '@/components/LoadingIndicator'
import { CONFIG } from '@/lib/config'
import { EdenContext } from '@/providers/EdenProvider'
import { Creation, Generator } from '@edenlabs/eden-sdk'
import { useViewportSize } from '@mantine/hooks'
import dynamic from 'next/dynamic'
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

const TimelineList = dynamic(
  () => import('@/components/Creation/CreationInterface/Timeline/TimelineList'),
  {
    loading: () => <LoadingIndicator />,
    ssr: false,
  },
)

const hiddenCreationGenerators = [
  'complete',
  'tts',
  'tts_fast',
  'sdxl-lora-trainer',
  'interrogate',
  'monologue',
]

const CreationInterface = ({
  generatorName,
  presetCreation,
  selectedGenerators,
}: {
  generatorName?: string
  presetCreation?: Creation
  selectedGenerators?: string[]
}) => {
  const resultPreviewRef = useRef<HTMLDivElement>(null)
  const { generators } = useContext(EdenContext)
  const [activeGenerator, setActiveGenerator] = useState<Generator | undefined>(
    undefined,
  )
  const [availableGenerators, setAvailableGenerators] = useState<
    Generator[] | undefined
  >(undefined)

  const handleGeneratorChange = useCallback(
    (value: string) => {
      const selectedGenerator = generators?.find(
        generator => generator.generatorName === value,
      )
      setActiveGenerator(selectedGenerator)
    },
    [generators],
  )

  const { width } = useViewportSize()

  useEffect(() => {
    if (width && width > 0) {
      if (width < 768) {
        setUsesDrawer(true)
      } else {
        setUsesDrawer(false)
      }
    }
  }, [width])

  const [drawerOpen, setDrawerOpen] = useState(true)
  const [usesDrawer, setUsesDrawer] = useState(false)

  useEffect(() => {
    const available = !selectedGenerators
      ? generators?.filter(
          generator =>
            !hiddenCreationGenerators.includes(generator.generatorName),
        )
      : generators?.filter(gen =>
          selectedGenerators?.includes(gen.generatorName),
        )

    setAvailableGenerators(available)
    setActiveGenerator(available?.[0])

    if (generatorName) {
      handleGeneratorChange(generatorName)
      return
    }

    if (presetCreation) {
      handleGeneratorChange(presetCreation.task.generator.generatorName)
      return
    }
  }, [generators, presetCreation, generatorName, handleGeneratorChange])

  const handleMaskClick = (
    event: React.MouseEvent<HTMLDivElement, MouseEvent>,
  ) => {
    if (event.target === event.currentTarget) {
      setDrawerOpen(false)
    }
  }

  const timelineRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleTimelineClick = (event: MouseEvent) => {
      if (
        timelineRef.current &&
        timelineRef.current.contains(event.target as Node)
      ) {
        setDrawerOpen(false)
      }
    }

    if (drawerOpen) {
      document.addEventListener('mousedown', handleTimelineClick)
    }

    return () => {
      document.removeEventListener('mousedown', handleTimelineClick)
    }
  }, [drawerOpen])

  if (!generators || !activeGenerator || !availableGenerators) {
    return <LoadingIndicator />
  }

  return (
    <div className="relative h-full md:flex md:gap-4 creation-interface mt-2">
      {usesDrawer && drawerOpen ? (
        <div
          className="fixed inset-0 z-10 md:hidden pointer-events-none"
          onClick={handleMaskClick}
        />
      ) : null}
      <div
        className={`fixed flex flex-col justify-end md:justify-normal overflow-hidden z-20 bottom-0 w-full create-form-drawer bg-gray-300 dark:bg-gray-950 rounded-lg rounded-b-none md:bottom-auto md:relative md:ml-4 md:mb-6 md:min-w-[320px] md:max-w-[380px] md:max-h-[calc(100%_-_16px)] md:border md:rounded-b-lg md:border-solid md:border-gray-200 md:dark:border-gray-800`}
      >
        <CreationWorkspace
          usesDrawer={usesDrawer}
          onDrawerToggle={setDrawerOpen}
          openedDrawer={drawerOpen}
          generators={availableGenerators}
          presetCreation={presetCreation}
          activeGenerator={activeGenerator}
          handleGeneratorChange={handleGeneratorChange}
        />
      </div>

      <div
        ref={timelineRef}
        className="w-full h-full md:h-auto overflow-y-auto px-4 md:px-0 md:pr-4 md:mt-0"
      >
        <TimelineList innerRef={resultPreviewRef} />
      </div>

      {CONFIG.DEV_TYPE === 'dummy' ? <TestGeneratorInterface /> : null}
    </div>
  )
}

export default CreationInterface
