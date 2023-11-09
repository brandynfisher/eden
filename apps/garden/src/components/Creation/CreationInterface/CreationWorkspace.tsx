import GeneratorForm from '@/components/Creation/CreationInterface/GeneratorForm'
import GeneratorSelectModalTrigger from '@/components/Creation/CreationInterface/GeneratorSelectModalTrigger'
import { Creation, Generator } from '@edenlabs/eden-sdk'
import ExpandLess from '@mui/icons-material/ExpandLess'
import { Button } from '@mui/material'
import React, { useEffect, useState } from 'react'

export type OutputType = 'image' | 'text' | 'video'

export const sdxl_generators_image = [
  'create',
  'remix',
  'blend',
  'upscale',
  'controlnet',
]
export const sdxl_generators_video = [
  'interpolate',
  'real2real',
  'dialogue',
  'monologue',
  'wav2lip',
]

const CreationWorkspace = ({
  onSettingsToggle,
  usesDrawer,
  openedDrawer,
  onDrawerToggle,
  generators,
  presetCreation,
  activeGenerator,
  handleGeneratorChange,
}: {
  onSettingsToggle?: Function
  usesDrawer?: boolean
  openedDrawer?: boolean
  onDrawerToggle?: Function
  generators: Generator[]
  presetCreation?: Creation
  activeGenerator: Generator
  handleGeneratorChange: (generatorName: Generator['generatorName']) => void
}) => {
  const [outputType, setOutputType] = useState<OutputType>()

  useEffect(() => {
    setOutputType(
      sdxl_generators_image.includes(activeGenerator.generatorName)
        ? 'image'
        : sdxl_generators_video.includes(activeGenerator.generatorName)
        ? 'video'
        : 'text',
    )
  }, [activeGenerator])

  return (
    <>
      <div className="relative z-0 w-full pb-0 bg-gray-100 dark:bg-gray-800 rounded-t-lg flex-shrink-0">
        {usesDrawer && onDrawerToggle ? (
          <Button
            size="small"
            className={`md:hidden cursor-pointer text-gray-500 hover:text-blue-500 w-full`}
            onClick={() => onDrawerToggle(!openedDrawer)}
          >
            {openedDrawer ? '' : 'Expand'}{' '}
            <ExpandLess
              fontSize="medium"
              className={`transition-all ${openedDrawer ? 'rotate-180' : ''}`}
            />
          </Button>
        ) : null}
        <div
          className={`p-2 ${
            usesDrawer && !openedDrawer ? 'hidden' : 'flex gap-2 items-center'
          }`}
        >
          <GeneratorSelectModalTrigger
            outputType={outputType}
            generators={generators}
            activeGenerator={activeGenerator}
            onChange={handleGeneratorChange}
          />
        </div>
      </div>

      <div className={`w-full md:h-full md:max-h-[calc(100%_-_48px)]`}>
        {activeGenerator && (
          <GeneratorForm
            outputType={outputType}
            onSettingsToggle={onSettingsToggle}
            usesDrawer={usesDrawer}
            openedDrawer={openedDrawer}
            generator={activeGenerator}
            presetCreation={presetCreation}
          />
        )}
      </div>
    </>
  )
}

export default CreationWorkspace
