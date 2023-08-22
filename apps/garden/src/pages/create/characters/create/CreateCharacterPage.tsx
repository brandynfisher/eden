import CharacterForm from '@/components/Characters/CharacterForm'
import Breadcrumbs from '@/components/Layout/navigation/Breadcrumbs'
import {
  ExperimentOutlined,
  HomeOutlined,
  RobotOutlined,
} from '@ant-design/icons'
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
  {
    path: '/create/characters',
    title: 'Characters',
    icon: <RobotOutlined />,
  },
  {
    title: `New Character`,
  },
]

const CreateCharacterPage = () => {
  return (
    <>
      <Breadcrumbs items={breadcrumbItems} />
      <CharacterForm />
    </>
  )
}

export default CreateCharacterPage
