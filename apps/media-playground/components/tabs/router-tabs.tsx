'use client'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import UserCreationsFeed from '@/components/user-creations-feed'
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation'
import { useEffect, useState } from 'react'

const RouterTabs = () => {
  const defaultTabName = 'creations'
  const params = useParams<{ name: string }>()
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
        <TabsTrigger value="creations" className="w-full">
          Creations
        </TabsTrigger>
        <TabsTrigger value="models" className="w-full">
          Models
        </TabsTrigger>
        <TabsTrigger value="collections" className="w-full">
          Collections
        </TabsTrigger>
      </TabsList>

      <TabsContent value="creations">
        <UserCreationsFeed userName={params.name} />
      </TabsContent>
      <TabsContent value="models">Tab 2 content - models</TabsContent>
      <TabsContent value="collections">Tab 3 content - collections</TabsContent>
    </Tabs>
  )
}

export default RouterTabs
