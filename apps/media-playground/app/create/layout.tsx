'use client'

import { useAppShell } from '@/components/layout/app-shell'
import EdenLogoBw from '@/components/logo/eden-logo-bw'
import { useRouter } from 'next/navigation'
import { PropsWithChildren, useEffect } from 'react'

const CreateLayout = ({ children }: PropsWithChildren) => {
  const { setConfig, resetConfig } = useAppShell()
  const router = useRouter()

  useEffect(() => {
    setConfig({
      sidebarVariant: 'sessions',
      mobileSidebarHeader: ({ close }) => (
        <div className="sticky top-0 z-50 bg-accent border-b px-3 py-3 flex items-center justify-between shrink-0">
          <button
            onClick={() => {
              close()
              router.push('/')
            }}
            className="flex items-center gap-2"
          >
            <EdenLogoBw className="w-[28px]" />
            <span className="text-lg font-semibold">Tools</span>
          </button>
        </div>
      ),
    })

    return () => resetConfig()
  }, [resetConfig, router, setConfig])

  return <>{children}</>
}

export default CreateLayout
