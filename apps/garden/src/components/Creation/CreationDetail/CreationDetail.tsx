import CodeBlock from '@/components/CodeBlock'
import CreationDetailToolButtons from '@/components/Creation/CreationDetail/CreationDetailToolButtons'
import SimilarCreations from '@/components/Creation/CreationDetail/SimilarCreations'
import CreationReactions from '@/components/Creation/CreationReactions'
import FollowControls from '@/components/FollowControls'
import MediaDisplay from '@/components/MediaDisplay'
import CreatorProfileLink from '@/components/Profile/CreatorProfileLink'
import TruncatedExpandableText from '@/components/TruncatedExpandableText'
import { CONFIG } from '@/lib/config'
import { getFileExtension } from '@/lib/getFileExtension'
import { durationSinceDate } from '@/lib/time'
import { CheckCircleOutlined, CopyOutlined } from '@ant-design/icons'
import { Creation, Generator, Task } from '@edenlabs/eden-sdk'
import { useClipboard } from '@mantine/hooks'
import { App, Button, Divider, Tabs } from 'antd'
import Head from 'next/head'
import React, { useRef, useState } from 'react'

const ConfigParamsTextTabContent = ({
  creationData,
}: {
  creationData: Creation
}) => {
  return (
    <>
      {creationData.task.config &&
        Object.entries(creationData.task.config).map(([key, val]) => {
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
        className="absolute right-6 top-2 flex items-center"
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
  return `import {EdenClient} from "eden-sdk";

const eden = new EdenClient();

const config = ${taskConfig}

const result = await eden.create("${generatorName}", config);`
}

const CreationDetail = ({
  creation,
  isModal,
}: {
  creation: Creation
  isModal?: boolean
}) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isMediaLoaded, setIsMediaLoaded] = useState(false)
  const [creationData, setCreationData] = useState(creation)
  const [mediaViewerVisible, setMediaViewerVisible] = useState(false)
  const [isRevealed, setIsRevealed] = useState(false)
  const timeSinceCreation = durationSinceDate(creation.createdAt)

  const formattedTaskConfig = JSON.stringify(creationData.task.config, null, 2)

  const items = [
    {
      key: '1',
      label: `Text`,
      children: <ConfigParamsTextTabContent creationData={creationData} />,
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
            creationData.task.generator.generatorName,
            formattedTaskConfig,
          )}
        />
      ),
    },
  ]

  const showMediaViewer = () => {
    setMediaViewerVisible(true)
  }

  const hideMediaViewer = () => {
    setMediaViewerVisible(false)
  }

  const onConfigurationTabChange = () => {
    // console.log('onConfigurationTabChange', key)
  }

  const isVideo = (creationUri: string) => {
    if (!creationUri) return null
    const extension = getFileExtension(creationUri)
    return extension === 'mp4'
  }

  const isImage = (creationUri: string) => {
    if (!creationUri) return null
    const extension = getFileExtension(creationUri)
    return extension === 'jpg'
  }

  return (
    <>
      <Head>
        <title>{`/${creation.task.generator.generatorName} by ${creation.user.username} - Creation | Garden of Eden`}</title>
        {isVideo(creation.uri) && (
          <>
            <meta property="og:type" content="video.other" />
            <meta
              property="og:video:duration"
              content={String(creation.mediaAttributes.duration)}
            />
          </>
        )}
        <meta
          property="og:title"
          key="title"
          content={`/${creation.task.generator.generatorName} by ${creation.user.username} - Creation | Garden of Eden`}
        />
        <meta
          property="og:description"
          content={creation.name}
          key="description"
        />
        <meta property="og:image" content={creation.thumbnail} key="image" />
        <meta property="og:image:secure_url" content={creation.thumbnail} />
        <meta
          property="og:image:alt"
          content={`/${creation.task.generator.generatorName} by ${creation.user.username} - Creation`}
        />
        <meta property="og:image:type" content="image/jpeg" />
        <meta
          property="og:url"
          content={`${CONFIG.NEXT_PUBLIC_HOST}/creations/${creation._id}`}
        />
      </Head>

      <div ref={containerRef}>
        <div className="lg:flex lg:flex-grow xl:flex xl:justify-center">
          <div className="mx-auto mb-4 lg:mb-0 lg:flex lg:flex-grow xl:mx-0 xl:flex-grow xl:flex xl:flex-col xl:min-w-[320px]">
            <div
              onClick={isImage(creation.uri) ? showMediaViewer : () => null}
              className="flex justify-center lg:flex lg:flex-grow"
              style={{ width: 'fit-content', margin: '0 auto' }}
            >
              {isImage(creation.uri) ? (
                <MediaDisplay
                  creationUri={creationData.uri}
                  previewUri={creationData.uri}
                  showPreview={mediaViewerVisible}
                  onPreviewClose={hideMediaViewer}
                  onLoad={() => {
                    // console.log('onload')
                    setIsMediaLoaded(true)
                  }}
                />
              ) : (
                <MediaDisplay
                  creationUri={creationData.uri}
                  onLoad={() => {
                    // console.log('onload')
                    setIsMediaLoaded(true)
                  }}
                />
              )}
            </div>
          </div>
          <div className="mx-auto lg:mx-0 md:max-w-[640px] xl:flex-grow xl:flex xl:flex-col lg:ml-4 lg:min-w-[320px] lg:max-w-[320px]">
            <div className="col-span-12 mb-4 border border-gray-300 dark:border-gray-800 border-solid rounded-lg p-4 bg-gray-100 dark:bg-gray-900">
              <CreationReactions
                creation={creationData}
                onChange={setCreationData}
              />
            </div>

            <div className="mb-4 col-span-4 xl:col-span-12 flex flex-col xs:flex-row min-w-0 p-4 border border-gray-300 dark:border-gray-800 border-solid rounded-lg justify-between flex-wrap">
              <div className="overflow-hidden flex items-center flex-shrink-0">
                <div className="min-w-0">
                  <CreatorProfileLink
                    creatorId={creationData.user.userId}
                    creatorName={creationData.user.username}
                  />
                </div>
              </div>
              <div className="flex items-center xl:w-full xl:mt-1 flex-shrink-0 ">
                <FollowControls creatorId={creationData.user.userId} />
              </div>
            </div>

            <div className="col-span-8 p-4 border border-gray-300 dark:border-gray-800 border-solid rounded-lg bg-gray-100 dark:bg-gray-900 relative mb-4">
              <div style={{ wordWrap: 'break-word' }}>
                <div className="flex justify-between items-center">
                  <div className="font-bold">
                    /{creation.task.generator?.generatorName}
                  </div>
                  <div className="text-gray-400 text-xs">
                    {timeSinceCreation}
                  </div>
                </div>
                <Divider className="my-4" />

                <TruncatedExpandableText text={creation.name} />
              </div>
            </div>

            <div className="flex mb-4 min-w-0 p-4 border border-gray-300 dark:border-gray-800 border-solid rounded-lg flex-wrap gap-4">
              <CreationDetailToolButtons creation={creation} />
            </div>

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
          </div>
        </div>

        {isMediaLoaded && (
          <SimilarCreations
            creation={creation}
            containerRef={containerRef}
            isModal={isModal}
          />
        )}
      </div>
    </>
  )
}

export default CreationDetail
