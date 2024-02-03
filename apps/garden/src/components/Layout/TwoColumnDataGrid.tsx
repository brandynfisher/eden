import LoadingIndicator from '@/components/LoadingIndicator'
import { useGenerator } from '@/hooks/useGenerator'
import { getDefaultGeneratorVersion } from '@/lib/generator'
import { capitalize } from '@/lib/string'
import CheckCircleOutlined from '@ant-design/icons/CheckCircleOutlined'
import CopyOutlined from '@ant-design/icons/CopyOutlined'
import { GeneratorParameter, Task } from '@edenlabs/eden-sdk'
import { useClipboard } from '@mantine/hooks'
import CheckBoxIcon from '@mui/icons-material/CheckBox'
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank'
import { App, Popover } from 'antd'
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

function formatKey(
  key: string,
  params: GeneratorParameter[],
): { label: string; description: string } {
  const param = params.filter(item => item.name === key)[0]

  if (param) {
    return {
      label: param.label,
      description: param.description || '',
    }
  }

  return {
    label: key,
    description: '',
  }
}

const ConfigParam = ({
  configKey,
  configValue,
  index,
  generatorParams,
}: {
  configKey: string
  configValue: string | number | boolean
  index: number
  generatorParams: GeneratorParameter[]
}) => {
  const { message } = App.useApp()
  const { copied, copy } = useClipboard()

  const handleCopyClick = async (
    key: string,
    text: string | number | boolean,
  ) => {
    copy(text)
    await message.success(
      <div>
        <strong>{capitalize(key)}</strong> copied
      </div>,
    )
  }

  if (configKey === 'isPrivate') return null
  const formattedValue = formatValue(configValue)
  if (formattedValue === null) return null
  const formattedKey = formatKey(configKey, generatorParams)

  return (
    <div
      onClick={() => handleCopyClick(configKey, configValue)}
      className="group hover:!text-blue-500 cursor-pointer "
    >
      <Popover
        className={`flex justify-between col-start-1 py-1 px-2 lg:pb-0 lg:pt-1 lg:px-2 text-gray-500 ${
          index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900' : ''
        }`}
        content={<div className="max-w-sm">{formattedKey.description}</div>}
        title={<div className="capitalize">{formattedKey.label}</div>}
        trigger={['click', 'hover']}
      >
        <div className="hover:text-gray-400">{formattedKey.label}</div>
        <div className="md:hidden md:group-hover:block group-hover:!text-blue-600">
          {copied ? <CheckCircleOutlined /> : <CopyOutlined />}
        </div>
      </Popover>
      <div
        className={`col-start-2 px-2 py-2 pr-2 lg:pb-2 lg:pt-0 lg:px-4 ${
          index % 2 === 0 ? 'bg-gray-50 dark:bg-gray-900' : ''
        }`}
        title={JSON.stringify(configValue)}
      >
        <div
          className={`break-words line-clamp-2 ${
            configValue === true || configValue === false ? 'flex' : ''
          }`}
        >
          {formatValue(configValue)}
        </div>
      </div>
    </div>
  )
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
    <div>
      {configParams.map(([key, value], index) => (
        <ConfigParam
          key={key}
          configValue={value}
          configKey={key}
          index={index}
          generatorParams={generatorParams}
        />
      ))}
    </div>
  )
}

export default TwoColumnDataGrid
