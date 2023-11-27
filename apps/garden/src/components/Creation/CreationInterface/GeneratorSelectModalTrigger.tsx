import { GeneratorOutputType } from '@/lib/generator'
import { MODAL_TYPES, useModalContext } from '@/providers/ModalProvider'
import { Generator } from '@edenlabs/eden-sdk'
import { MenuOpenOutlined } from '@mui/icons-material'
import Article from '@mui/icons-material/Article'
import MovieFilter from '@mui/icons-material/MovieFilter'
import Wallpaper from '@mui/icons-material/Wallpaper'
import Button from '@mui/material/Button'
import React from 'react'

const GeneratorSelectModalTrigger = ({
  outputType,
  generators,
  activeGenerator,
  onChange,
}: {
  outputType?: GeneratorOutputType
  generators: Generator[]
  activeGenerator: Generator
  onChange: (generatorName: string) => void
}) => {
  const { showModal, hideModal } = useModalContext()

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
      onClick={handleClickOpen}
      className="w-full flex !py-1 !px-2 items-center gap-2 !bg-gray-300 hover:!bg-gray-400 dark:!bg-gray-950 dark:hover:!bg-gray-950 bg-opacity-50 hover:!bg-opacity-70 !normal-case"
    >
      <div className="w-full flex items-center gap-2">
        {outputType === 'image' ? (
          <Wallpaper fontSize="medium" />
        ) : outputType === 'video' ? (
          <MovieFilter fontSize="medium" />
        ) : (
          <Article fontSize="medium" />
        )}
        <div className="mr-auto h-[24px] font-mono">
          /{activeGenerator.generatorName}
        </div>

        <MenuOpenOutlined fontSize="medium" />
      </div>
    </Button>
  )
}

export default GeneratorSelectModalTrigger
