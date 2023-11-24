import { OutputType } from '@/components/Creation/CreationInterface/CreationWorkspace'
import { conceptGenerator } from '@/lib/generator'
import { MODAL_TYPES, useModalContext } from '@/providers/ModalProvider'
import { Generator } from '@edenlabs/eden-sdk'
import Article from '@mui/icons-material/Article'
import MenuIcon from '@mui/icons-material/Menu'
import ModelTrainingIcon from '@mui/icons-material/ModelTraining'
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
  outputType?: OutputType
  generators: Generator[]
  activeGenerator: Generator
  onChange: (generatorName: string) => void
}) => {
  const { showModal, hideModal } = useModalContext()

  const handleClickOpen = () => {
    if (generators.length === 1) return

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
      className={`w-full bg-gray-300 dark:bg-gray-900 bg-opacity-50 !normal-case ${
        generators.length > 1
          ? 'hover:!bg-gray-300 dark:hover:!bg-gray-950 hover:!bg-opacity-70 '
          : 'pointer-events-none !cursor-auto'
      }`}
    >
      <div className="w-full flex items-center gap-2">
        {outputType === 'image' ? (
          <Wallpaper fontSize="medium" />
        ) : outputType === 'video' ? (
          <MovieFilter fontSize="medium" />
        ) : activeGenerator.generatorName === conceptGenerator.name ? (
          <ModelTrainingIcon fontSize="medium" />
        ) : (
          <Article fontSize="medium" />
        )}
        <div className="mr-auto h-[24px] font-mono">
          /
          {activeGenerator.generatorName === conceptGenerator.name
            ? conceptGenerator.displayName
            : activeGenerator.generatorName}
        </div>

        {generators.length > 1 ? <MenuIcon fontSize="medium" /> : null}
      </div>
    </Button>
  )
}

export default GeneratorSelectModalTrigger
