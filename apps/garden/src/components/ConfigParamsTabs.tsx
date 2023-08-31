import CodeBlock from '@/components/CodeBlock'
import { CheckCircleOutlined, CopyOutlined } from '@ant-design/icons'
import { Concept, Creation, Generator, Task } from '@edenlabs/eden-sdk'
import { useClipboard } from '@mantine/hooks'
import { App, Button, Tabs } from 'antd'
import React, { useState } from 'react'

const ConfigParamsTextTabContent = ({ data }: { data: Creation | Concept }) => {
  return (
    <>
      {data.task.config &&
        Object.entries(data.task.config).map(([key, val]) => {
          const configValue = JSON.stringify(val)

          return (
            <div
              key={`cfg-${key}`}
              className="py-2 px-4 m-0 first:pt-0 xl last:mb-0 justify-between grid xs:grid-cols-2 sm:grid-cols-3 xl:grid-cols-2  [&:nth-child(even)]:bg-gray-50 [&:nth-child(even)]:dark:bg-gray-900"
            >
              <div
                className={`text-gray-500 flex-shrink-0 ${
                  key.length > 17 ? 'col-span-2' : ''
                }`}
              >
                {key}
              </div>
              <div
                className={`break-words px-1 line-clamp-2 ${
                  configValue.length > 17 ? 'col-span-2' : ''
                }`}
                title={configValue}
              >
                {configValue}
              </div>
            </div>
          )
        })}
    </>
  )
}

const ConfigParamsCodeTabContent = ({
  taskConfig,
}: {
  taskConfig: Task['config']
}) => {
  const { message } = App.useApp()
  const { copied, copy } = useClipboard({ timeout: 750 })

  const handleCopyClick = async () => {
    await copy(taskConfig)

    message.destroy()
    message.success(`Copied to clipboard!`)
  }

  return (
    <div className="relative">
      <Button
        className="absolute right-6 top-2 flex items-center cursor-copy"
        onClick={handleCopyClick}
        title={'Copy'}
      >
        {copied ? <CheckCircleOutlined /> : <CopyOutlined />}
      </Button>
      <div className="px-4 mb-2 ">
        <CodeBlock code={taskConfig} language="javascript" />
      </div>
    </div>
  )
}

const createEdenSdkCodeSnippet = (
  generatorName: Generator['generatorName'],
  taskConfig: Task['config'],
) => {
  return `import {EdenClient} from "@edenlabs/eden-sdk";

const eden = new EdenClient({
  apiKey: "YOUR_API_KEY",
  apiSecret: "YOUR_API_SECRET"
});

const config = ${taskConfig}

const result = await eden.tasks.create({
  generatorName: "${generatorName}",
  config: config
});`
}

const ConfigParamsTabs = ({ data }: { data: Concept | Creation }) => {
  const [isRevealed, setIsRevealed] = useState(false)

  const items = [
    {
      key: '1',
      label: `Text`,
      children: <ConfigParamsTextTabContent data={data} />,
    },
    // {
    //   key: '2',
    //   label: `JSON`,
    //   children: <ConfigParamsCodeTabContent taskConfig={formattedTaskConfig} />,
    // },
    {
      key: '3',
      label: `Eden SDK`,
      children: (
        <ConfigParamsCodeTabContent
          taskConfig={createEdenSdkCodeSnippet(
            data?.task?.generator?.generatorName,
            JSON.stringify(data?.task?.config, null, 2),
          )}
        />
      ),
    },
  ]

  const onConfigurationTabChange = () => {
    // console.log('onConfigurationTabChange', key)
  }

  return (
    <>
      <div className="flex w-full justify-center items-center mb-4">
        <Button
          type="dashed"
          className="dark:text-gray-400"
          onClick={() => setIsRevealed(!isRevealed)}
        >
          {isRevealed ? 'Hide' : 'Show'} configuration
        </Button>
      </div>

      {isRevealed && (
        <>
          <div className="border border-gray-300 dark:border-gray-800 border-solid rounded-lg justify-between flex-wrap overflow-hidden text-xs">
            <Tabs
              centered
              defaultActiveKey="1"
              items={items}
              onChange={onConfigurationTabChange}
            />
          </div>

          <div className="flex w-full justify-center items-center my-4">
            <Button
              type="dashed"
              className="dark:text-gray-400"
              onClick={() => setIsRevealed(false)}
            >
              Hide configuration
            </Button>
          </div>
        </>
      )}
    </>
  )
}

export default ConfigParamsTabs
