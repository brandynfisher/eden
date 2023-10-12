import SvgDiscord from '@/components/Layout/icons/DiscordIcon'
import { GithubOutlined, TwitterOutlined } from '@ant-design/icons'
import { Instagram } from '@mui/icons-material'
import React from 'react'

const SocialLinks = () => {
  return (
    <div className={`flex gap-4 px-4 py-3 items-center justify-center`}>
      <a
        href="https://github.com/abraham-ai"
        target="_blank"
        rel="noopener noreferrer"
        title="Eden on Github"
        className="text-black dark:text-gray-400 hover:text-blue-400 hover:dark:text-blue-400 flex items-center"
      >
        <GithubOutlined className="text-2xl" />
      </a>
      <a
        href="https://discord.com/invite/4dSYwDT"
        target="_blank"
        rel="noopener noreferrer"
        title="Eden on Discord"
        className="text-black dark:text-gray-400 hover:text-blue-400 hover:dark:text-blue-400 flex items-center"
      >
        <SvgDiscord className="text-2xl" />
      </a>
      <a
        href="https://twitter.com/eden_art_"
        target="_blank"
        rel="noopener noreferrer"
        title="Eden on Twitter"
        className="text-black dark:text-gray-400 hover:text-blue-400 hover:dark:text-blue-400 flex items-center"
      >
        <TwitterOutlined className="text-2xl" />
      </a>
      <a
        href="https://www.instagram.com/eden.art____/"
        target="_blank"
        rel="noopener noreferrer"
        title="Eden on Instagram"
        className="text-black dark:text-gray-400 hover:text-blue-400 hover:dark:text-blue-400 flex items-center"
      >
        <Instagram />
      </a>
    </div>
  )
}

export default SocialLinks
