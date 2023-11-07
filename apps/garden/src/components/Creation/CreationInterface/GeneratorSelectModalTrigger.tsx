import { MODAL_TYPES, useModalContext } from '@/providers/ModalProvider'
import { Generator } from '@edenlabs/eden-sdk'
import Article from '@mui/icons-material/Article'
import MenuIcon from '@mui/icons-material/Menu'
import MovieFilter from '@mui/icons-material/MovieFilter'
import Wallpaper from '@mui/icons-material/Wallpaper'
import Button from '@mui/material/Button'
import React, { useEffect, useState } from 'react'

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

const GeneratorSelectModalTrigger = ({
  generators,
  activeGenerator,
  onChange,
}: {
  generators: Generator[]
  activeGenerator: Generator
  onChange: (generatorName: string) => void
}) => {
  const { showModal, hideModal } = useModalContext()
  const [generatorOutputType, setGeneratorOutputType] = useState<
    'video' | 'image' | 'text'
  >()

  useEffect(() => {
    setGeneratorOutputType(
      sdxl_generators_image.includes(activeGenerator.generatorName)
        ? 'image'
        : sdxl_generators_video.includes(activeGenerator.generatorName)
        ? 'video'
        : 'text',
    )
  }, [activeGenerator.generatorName])

  const handleClickOpen = () => {
    showModal(MODAL_TYPES.GENERATOR_SELECT_MODAL, {
      generators,
      activeGenerator,
      onChange: handleChange,
    })
  }

  const handleChange = (generator: Generator) => {
    onChange(generator.generatorName)
    hideModal(MODAL_TYPES.GENERATOR_SELECT_MODAL)
  }

  return (
    <Button
      variant="outlined"
      // color="primary"
      // size="small"
      onClick={handleClickOpen}
      className="w-full bg-gray-300 hover:!bg-gray-300 dark:bg-gray-900 dark:hover:!bg-gray-950 bg-opacity-50 hover:!bg-opacity-70 !normal-case"
    >
      <div className="w-full flex items-center gap-2">
        {generatorOutputType === 'image' ? (
          <Wallpaper fontSize="medium" />
        ) : generatorOutputType === 'video' ? (
          <MovieFilter fontSize="medium" />
        ) : (
          <Article fontSize="medium" />
        )}
        <div className="mr-auto h-[24px] font-mono">
          /{activeGenerator.generatorName}
        </div>

        <MenuIcon fontSize="medium" />
      </div>
    </Button>
  )
}

export default GeneratorSelectModalTrigger
