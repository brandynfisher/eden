import GeneratorForm from '@/components/Creation/CreationInterface/GeneratorForm'
import { Creation, Generator } from '@edenlabs/eden-sdk'
import ExpandLess from '@mui/icons-material/ExpandLess'
import { Button } from '@mui/material'
import { Select } from 'antd'
import React from 'react'

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
  return (
    <>
      <div className="relative z-0 w-full md:pt-2 pb-0 bg-gray-100 dark:bg-gray-800 rounded-t-lg">
        {usesDrawer && onDrawerToggle ? (
          <Button
            size="small"
            className={`md:hidden cursor-pointer hover:text-blue-500 w-full`}
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
          className={`px-4 pt-1 md:pt-2 md:mb-0 ${
            usesDrawer && !openedDrawer ? 'hidden' : 'flex'
          }`}
        >
          <Select
            id="activeGenerator"
            value={activeGenerator?.generatorName}
            onChange={handleGeneratorChange}
            placeholder="Generators"
            className="w-full"
          >
            {generators.map(generator => (
              <Select.Option
                key={generator.generatorName}
                value={generator.generatorName}
              >
                /{generator.generatorName}
              </Select.Option>
            ))}
          </Select>
        </div>
      </div>

      <div
        className={`w-full md:h-full md:max-h-[calc(100%_-_48px)]`}
      >
        {activeGenerator && (
          <GeneratorForm
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
