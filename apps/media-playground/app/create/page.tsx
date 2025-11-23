'use client'

import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

const CreateRedirect = () => {
  const router = useRouter()

  useEffect(() => {
    router.replace('/studio')
  }, [router])

  return null
}

export default CreateRedirect
