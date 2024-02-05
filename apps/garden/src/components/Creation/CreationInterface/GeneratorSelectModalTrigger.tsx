import { GeneratorOutputType } from '@/lib/generator'
import { conceptGenerator } from '@/lib/generator'
import { MODAL_TYPES, useModalContext } from '@/providers/ModalProvider'
import { Generator } from '@edenlabs/eden-sdk'
import Article from '@mui/icons-material/Article'
// import { ExpandCircleDown, MenuOpenOutlined } from '@mui/icons-material'
import ExpandCircleDown from '@mui/icons-material/ExpandCircleDown'
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
  outputType?: GeneratorOutputType
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
    hideModal(null, MODAL_TYPES.GENERATOR_SELECT_MODAL)
  }

  return (
    <>
      <Button
        variant="outlined"
        onClick={handleClickOpen}
        className={`relative w-full flex !py-1 !px-2 items-center gap-2 !bg-gray-200 dark:!bg-gray-950 bg-opacity-50 !normal-case font-bold ${
          generators.length > 1
            ? 'hover:!bg-gray-400 dark:hover:!bg-gray-950 hover:!bg-opacity-70 bg-black'
            : 'pointer-events-none !cursor-auto'
        }`}
        data-testid="generator-select-modal-trigger"
      >
        {generators.length > 1 ? (
          <div className="absolute z-50 -inset-0.5 border-2 border-solid border-[#90caf9] blur-sm rounded-md transition duration-[1500] animate-pulse"></div>
        ) : null}
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
            <span className="text-xs">Generator:</span> /
            {activeGenerator.generatorName === conceptGenerator.name
              ? conceptGenerator.displayName
              : activeGenerator.generatorName}
          </div>

          {generators.length > 1 ? (
            <ExpandCircleDown fontSize="medium" />
          ) : null}
        </div>
      </Button>
    </>
  )
}

export default GeneratorSelectModalTrigger
