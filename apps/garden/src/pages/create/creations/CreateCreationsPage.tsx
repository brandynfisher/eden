import CreationInterface from '@/components/Creation/CreationInterface/CreationInterface'
import Breadcrumbs from '@/components/Layout/navigation/Breadcrumbs'
import LoadingIndicator from '@/components/LoadingIndicator'
import { useCreation } from '@/hooks/useCreation'
import { ExperimentOutlined, HomeOutlined } from '@ant-design/icons'
import FilterVintageIcon from '@mui/icons-material/FilterVintage'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'

const CreatePageWithPreset = ({
  generator,
  presetId,
}: {
  generator?: string
  presetId: string
}) => {
  const { creation } = useCreation(presetId)

  if (!creation) {
    return <LoadingIndicator />
  }

  return (
    <CreationInterface presetCreation={creation} generatorName={generator} />
  )
}

const CreatePageDefault = () => {
  return <CreationInterface />
}

const breadcrumbItems = [
  {
    path: '/',
    icon: <HomeOutlined />,
  },
  {
    path: '/create',
    title: 'Create',
    icon: <ExperimentOutlined />,
  },
  {
    title: 'Creations',
    icon: <FilterVintageIcon fontSize="inherit" />,
  },
]

const CreateCreationsPage = () => {
  const router = useRouter()
  const [usesPreset, setUsesPreset] = useState<boolean>(false)

  useEffect(() => {
    if (!router.query) {
      setUsesPreset(false)
      return
    }

    setUsesPreset(!!router.query.presetId)
  }, [router.query])

  return (
    <div className={`flex flex-col`}>
      <Breadcrumbs items={breadcrumbItems} />

      {usesPreset ? (
        <CreatePageWithPreset
          generator={
            router.query.generator ? String(router.query.generator) : undefined
          }
          presetId={String(router.query.presetId)}
        />
      ) : (
        <CreatePageDefault />
      )}
    </div>
  )
}

export default CreateCreationsPage
