import Breadcrumbs from '@/components/Layout/navigation/Breadcrumbs'
import { ExperimentOutlined, HomeOutlined } from '@ant-design/icons'
import ModelTrainingIcon from '@mui/icons-material/ModelTraining'
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
    title: 'Concepts',
    icon: <ModelTrainingIcon fontSize="inherit" />,
  },
]

const CreateConceptPage = () => {
  return (
    <div>
      <Breadcrumbs items={breadcrumbItems} />

      <div>Concept Trainer</div>
    </div>
  )
}

export default CreateConceptPage
