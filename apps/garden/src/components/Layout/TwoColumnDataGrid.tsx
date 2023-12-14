import LoadingIndicator from '@/components/LoadingIndicator'
import { useGenerator } from '@/hooks/useGenerator'
import { getDefaultGeneratorVersion } from '@/lib/generator'
import { GeneratorParameter, Task } from '@edenlabs/eden-sdk'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import React, { ReactNode } from 'react'

function replaceQuotes(s: string): string {
  if (s[0] === '"' && s[s.length - 1] === '"') {
    return s.substring(1, s.length - 1)
  }
  return s
}

function formatValue(value: string | boolean | number): string | ReactNode {
  if (value === true) return <CheckBoxIcon />
  if (value === false) return <CheckBoxOutlineBlankIcon />
  if (typeof value === 'string') {
    const trimmed = replaceQuotes(value)
    if (trimmed) return trimmed
    return null
  }
  return JSON.stringify(value)
}

function formatKey(key: string, params: GeneratorParameter[]): string {
  const param = params.filter(item => item.name === key)[0]

  if (param) {
    return param.label
  }

  return key
}

const TwoColumnDataGrid = ({ task }: { task: Task }) => {
  const configParams: [string, string | number | boolean][] = Object.entries(
    task.config,
  )
  const { generator, isLoading } = useGenerator(task.generator.generatorName)
  const generatorParams = generator
    ? getDefaultGeneratorVersion(generator).parameters
    : []

  if (!generator || isLoading) {
    return (
      <div className="pb-4">
        <LoadingIndicator />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-[auto,1fr] lg:block">
      {configParams.map(([key, value], index) => {
        if (key === 'isPrivate') return null
        const formattedValue = formatValue(value)
        if (formattedValue === null) return null
        const formattedKey = formatKey(key, generatorParams)

        return (
          <React.Fragment key={index}>
            <div
              className={`col-start-1 py-2 px-2 lg:pb-0 lg:pt-1 lg:px-2 text-gray-500 ${
                index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900' : ''
              }`}
            >
              {formattedKey}
            </div>
            <div
              className={`col-start-2 py-2 pr-2 lg:pb-2 lg:pt-0 lg:px-4 ${
                index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900' : ''
              }`}
              title={JSON.stringify(value)}
            >
              <div
                className={`break-words line-clamp-2 ${
                  value === true || value === false ? 'flex' : ''
                }`}
              >
                {formatValue(value)}
              </div>
            </div>
          </React.Fragment>
        )
      })}
    </div>
  )
}

export default TwoColumnDataGrid
