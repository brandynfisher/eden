'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { ReactNode, useEffect, useState } from 'react'

type RouterTab = {
  key: string
  title: string
  content: ReactNode
}

type Props = {
  tabs: RouterTab[]
}

const RouterTabs = ({ tabs }: Props) => {
  const defaultTabName = tabs[0].key

  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const initialTab = searchParams.get('tab') || defaultTabName
  const [activeTab, setActiveTab] = useState(initialTab)

  const handleTabChange = (value: string) => {
    setActiveTab(value)
    router.push(`${pathname}${value === defaultTabName ? '' : `?tab=${value}`}`)
  }

  useEffect(() => {
    setActiveTab(initialTab)
  }, [initialTab])

  return (
    <Tabs
      value={activeTab}
      defaultValue={defaultTabName}
      onValueChange={handleTabChange}
      className="w-full max-w-full"
    >
      <TabsList className="flex justify-stretch lg:max-w-md mb-4">
        {tabs.map(tab => (
          <TabsTrigger key={tab.key} value={tab.key} className="w-full">
            {tab.title}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map(tab => (
        <TabsContent key={tab.key} value={tab.key}>
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  )
}

export default RouterTabs
