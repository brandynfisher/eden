import Breadcrumbs from '@/components/Layout/navigation/Breadcrumbs'
import CreateMenu from '@/components/Layout/navigation/CreateMenu'
import { ExperimentOutlined, HomeOutlined } from '@ant-design/icons'
import React from 'react'

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
]

const CreatePage = () => {
  return (
    <div className="flex flex-col">
      <Breadcrumbs items={breadcrumbItems} />
      <CreateMenu />
    </div>
  )
}

export default CreatePage
