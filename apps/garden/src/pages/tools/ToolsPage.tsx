import DiscordAuthButton from '@/components/DiscordAuthButton'
import SvgDiscord from '@/components/Layout/icons/DiscordIcon'
import LoadingIndicator from '@/components/LoadingIndicator'
import { UserContext } from '@/providers/UserProvider'
import KeyOutlined from '@mui/icons-material/KeyOutlined'
import { Collapse } from 'antd'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import React, { useContext } from 'react'

const { Panel } = Collapse

const ApiKeys = dynamic(() => import('@/components/ApiKeys'), {
  loading: () => <LoadingIndicator />,
})

const ToolsPage = () => {
  const { featureFlags } = useContext(UserContext)
  const isPreviewUser = featureFlags?.includes('preview')

  return (
    <>
      <div className="w-full grid grid-cols-12">
        <div className="flex flex-col space-y-4 col-span-12 xl:col-span-8 mb-4">
          <Collapse expandIconPosition="start" defaultActiveKey={'discord'}>
            <Panel
              key={'discord'}
              header={'Discord Account'}
              extra={<SvgDiscord />}
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h3>Linking your Discord account to Eden:</h3>
                  <ul className="pl-4">
                    <li>
                      Enables attribution of creations made with our discord
                      bots to your profile
                    </li>
                  </ul>
                </div>
                <DiscordAuthButton />
              </div>
            </Panel>
            <Panel key={'apiKeys'} header={'API Keys'} extra={<KeyOutlined />}>
              {isPreviewUser ? (
                <ApiKeys />
              ) : (
                <div className="text-gray-500">
                  Upgrade your <Link href="/manna">subscription</Link> for API
                  access.
                </div>
              )}
            </Panel>
          </Collapse>
        </div>
      </div>
    </>
  )
}

export default ToolsPage
