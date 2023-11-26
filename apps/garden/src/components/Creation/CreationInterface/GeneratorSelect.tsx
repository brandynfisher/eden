import {
  sdxl_generators_image,
  sdxl_generators_video,
} from '@/components/Creation/CreationInterface/CreationWorkspace'
import { Generator } from '@edenlabs/eden-sdk'
import LinkOutlined from '@mui/icons-material/LinkOutlined'
import MovieFilter from '@mui/icons-material/MovieFilter'
import Wallpaper from '@mui/icons-material/Wallpaper'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'

const ListItem = ({
  title,
  text,
  imageUrl,
  selected,
  onClick,
}: {
  title: string
  text: string
  imageUrl: string
  selected?: boolean
  onClick?: () => void
}) => {
  const [imgSrc, setImgSrc] = useState(imageUrl)

  useEffect(() => {
    setImgSrc(imageUrl)
  }, [imageUrl])

  return (
    <div
      onClick={() => onClick && onClick()}
      className={`cursor-pointer border border-solid border-gray-700 bg-gray-50 dark:bg-gray-900 overflow-hidden ${
        selected
          ? '!bg-gray-300 dark:!bg-gray-900 border-green-800'
          : 'hover:!bg-gray-200 hover:dark:!bg-gray-800'
      } hover:border-blue-400  hover:dark:border-blue-600 hover:dark:bg-gray-950 rounded-lg font-mono `}
    >
      <div className="relative flex gap-2 flex-col sm:flex-row">
        <div className="flex items-center justify-center relative">
          <Image
            width={198}
            height={140}
            src={imgSrc}
            alt={imgSrc}
            onError={() => {
              setImgSrc('/placeholder.png')
            }}
            className="object-contain"
          />
        </div>
        <div className="w-full px-4 pb-4 sm:pb-0 sm:px-2 sm:py-2">
          <div className="font-bold mb-1 dark:text-gray-200 flex items-center justify-between flex-wrap">
            <div>/{title}</div>
            {selected ? <div className="text-blue-500">active</div> : null}
          </div>
          <div className="text-gray-500">{text}</div>
        </div>
      </div>
    </div>
  )
}

const GeneratorList = ({
  generators,
  activeGenerator,
  onSelect,
}: {
  generators: Generator[]
  activeGenerator: Generator
  onSelect?: (generator: Generator) => void
}) => {
  const generatorGroups = [
    {
      title: 'Image',
      icon: <Wallpaper fontSize="medium" />,
      generators: generators.filter(generator =>
        sdxl_generators_image.includes(generator.generatorName),
      ),
    },
    {
      title: 'Video',
      icon: <MovieFilter fontSize="medium" />,
      generators: generators.filter(generator =>
        sdxl_generators_video.includes(generator.generatorName),
      ),
    },
    // {
    //   title: 'Text',
    //   icon: <Article fontSize="medium" />,
    //   generators: generators.filter((generator) => sdxl_generators_video.includes(generator.generatorName))
    // }
  ]

  return (
    <div className="flex flex-col justify-between gap-2">
      <div>
        {generatorGroups.map(group => (
          <div
            key={group.title}
            className="lg:flex lg:flex-col gap-2 mb-4 border-0 lg:border-b lg:border-solid border-gray-300 dark:border-gray-800 last:border-b-0"
          >
            <h3 className="flex self-start items-center gap-2">
              {group.icon}
              <div>{group.title}</div>
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              {group.generators.map((generator: Generator) => (
                <ListItem
                  key={generator.generatorName}
                  title={generator.generatorName}
                  text={generator.description}
                  imageUrl={`/images/${generator.generatorName}.png`}
                  selected={
                    generator.generatorName === activeGenerator.generatorName
                  }
                  onClick={() => onSelect && onSelect(generator)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export const DocsLink = ({ generator }: { generator: Generator }) => {
  if (generator.output === 'creation') {
    return (
      <a
        href="https://docs.eden.art/docs/guides/creation"
        target="_blank"
        className="flex gap-1 items-center"
      >
        Learn about Creations
        <LinkOutlined />
      </a>
    )
  }

  return (
    <a
      href="https://docs.eden.art/docs/guides/concepts"
      target="_blank"
      className="flex gap-1 items-center"
    >
      Learn about Concepts
      <LinkOutlined />
    </a>
  )
}

export default GeneratorList
