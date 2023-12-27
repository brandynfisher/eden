import CodeBlock from '@/components/CodeBlock'
import TwoColumnDataGrid from '@/components/Layout/TwoColumnDataGrid'
import CheckCircleOutlined from '@ant-design/icons/CheckCircleOutlined'
import CopyOutlined from '@ant-design/icons/CopyOutlined'
import { Concept, Creation, Generator, Task } from '@edenlabs/eden-sdk'
import { useClipboard } from '@mantine/hooks'
import { App, Button, Tabs } from 'antd'
import React, { useState } from 'react'

const ConfigParamsTextTabContent = ({ data }: { data: Creation | Concept }) => {
  return <TwoColumnDataGrid task={data.task} />
}

const ConfigParamsCodeTabContent = ({
  taskConfig,
}: {
  taskConfig: Task['config']
}) => {
  const { message } = App.useApp()
  const { copied, copy } = useClipboard({ timeout: 750 })

  const handleCopyClick = async () => {
    copy(taskConfig)

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

  const onConfigurationTabChange = () => {}

  return (
    <>
      <div className="flex w-full justify-start md:justify-center items-center my-2">
        <Button
          type="dashed"
          className="dark:text-gray-400 "
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

          <div className="flex w-full  justify-start md:justify-center items-center my-2">
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
