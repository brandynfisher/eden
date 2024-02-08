import CreationWorkspace from '@/components/Creation/CreationInterface/CreationWorkspace'
import TestGeneratorInterface from '@/components/Creation/CreationInterface/TestGeneratorInterface'
import TimelineList from '@/components/Creation/CreationInterface/Timeline/TimelineList'
import LoadingIndicator from '@/components/LoadingIndicator'
import { CONFIG } from '@/lib/config'
import { conceptGenerator } from '@/lib/generator'
import { EdenContext } from '@/providers/EdenProvider'
import { Creation, Generator } from '@edenlabs/eden-sdk'
import { useViewportSize } from '@mantine/hooks'
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'

const CreationInterface = ({
  generatorName,
  presetCreation,
  selectedGenerators,
}: {
  generatorName?: string
  presetCreation?: Creation
  selectedGenerators?: string[]
}) => {
  const timelineListRef = useRef<HTMLDivElement>(null)
  const { generators } = useContext(EdenContext)
  const [activeGenerator, setActiveGenerator] = useState<Generator | undefined>(
    undefined,
  )
  const [availableGenerators, setAvailableGenerators] = useState<
    Generator[] | undefined
  >(undefined)

  const handleGeneratorChange = useCallback(
    (value: string) => {
      // @todo: persist settings for current generator in local storage before swapping
      // @todo: restore settings (if present) of newly activated generator (make sure to not get overridden by preset etc)

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
      ? generators
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

  return (
    <div className="relative h-full md:flex md:gap-4 creation-interface mt-2">
      {usesDrawer && drawerOpen ? (
        <div
          className="fixed inset-0 z-10 md:hidden pointer-events-none"
          onClick={handleMaskClick}
        />
      ) : null}
      <div
        data-testid="creation-workspace-wrap"
        className={`fixed flex flex-col justify-end md:justify-normal overflow-hidden z-20 bottom-0 w-full create-form-drawer bg-gray-300 dark:bg-gray-950 rounded-lg rounded-b-none md:bottom-auto md:relative md:ml-4 md:mb-6 md:min-w-[320px] md:max-w-[380px] md:max-h-[calc(100%_-_16px)] md:border md:rounded-b-lg md:border-solid md:border-gray-200 md:dark:border-gray-800`}
      >
        {!generators || !activeGenerator || !availableGenerators ? (
          <LoadingIndicator />
        ) : (
          <CreationWorkspace
            usesDrawer={usesDrawer}
            onDrawerToggle={setDrawerOpen}
            openedDrawer={drawerOpen}
            generators={availableGenerators}
            presetCreation={presetCreation}
            activeGenerator={activeGenerator}
            handleGeneratorChange={handleGeneratorChange}
          />
        )}
      </div>

      <div
        ref={timelineRef}
        className="w-full h-full md:h-auto pl-2 md:px-0 md:mt-0"
      >
        {!generators || !activeGenerator || !availableGenerators ? (
          <LoadingIndicator />
        ) : (
          <TimelineList
            innerRef={timelineListRef}
            type={
              activeGenerator.generatorName === conceptGenerator.name
                ? 'concepts'
                : 'creations'
            }
          />
        )}
      </div>

      {CONFIG.DEV_TYPE === 'dummy' ? <TestGeneratorInterface /> : null}
    </div>
  )
}

export default CreationInterface
