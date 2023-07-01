import OptionParameter from '@/components/CreationInterface/parameters/OptionParameter'
import SliderParameter from '@/components/CreationInterface/parameters/SliderParameter'
import StringParameter from '@/components/CreationInterface/parameters/StringParameter'
import UploadParameter from '@/components/CreationInterface/parameters/UploadParameter'
import { requireAuth } from '@/lib/auth'
import { CreationNotificationContext } from '@/providers/CreationNotificationProvider'
import { UserContext } from '@/providers/UserProvider'
import {
  DownCircleOutlined,
  ExperimentOutlined,
  UpCircleOutlined,
} from '@ant-design/icons'
import { Generator, GeneratorParameter } from '@eden-labs/eden-sdk'
import { Button, Card, Form } from 'antd'
import axios from 'axios'
import React, { useContext, useEffect, useState } from 'react'
import { toast } from 'react-toastify'

const GeneratorForm = ({ generator }: { generator: Generator }) => {
  const {
    taskIds,
    setTaskIds,
    setActiveTaskId,
    setHasChangedGenerator,
    refetchPendingTasks,
  } = useContext(CreationNotificationContext)
  const { refetch, isAuthenticated, authenticate } = useContext(UserContext)
  const [form] = Form.useForm()
  const selectedVersion = generator.versions[0]
  const { parameters } = selectedVersion
  const requiredParameters = parameters.filter(
    parameter => parameter.isRequired,
  )
  const optionalParameters = parameters.filter(
    parameter => !parameter.isRequired,
  )
  const [showOptional, setShowOptional] = React.useState(false)

  const [stringArrayValues, setStringArrayValues] = useState({})

  const onStringArrayChange = (parameterName: string, newValues: string[]) => {
    const newStringArrayValues = { ...stringArrayValues }
    //@ts-ignore
    newStringArrayValues[parameterName] = newValues
    setStringArrayValues(newStringArrayValues)
  }

  const handleFinish = async () => {
    if (!isAuthenticated) {
      await requireAuth(authenticate)
      return
    }
    try {
      const formFieldValues = form.getFieldsValue()
      const consolidatedFieldValues = {
        ...formFieldValues,
        ...stringArrayValues,
      }

      const response = await axios.post('/api/tasks/create', {
        generatorName: generator.generatorName,
        config: consolidatedFieldValues,
      })
      toast.success('Task created!')
      const { taskId } = response.data
      setActiveTaskId && setActiveTaskId(taskId)
      setTaskIds && setTaskIds([...taskIds, taskId])
      setHasChangedGenerator && setHasChangedGenerator(false)
      refetchPendingTasks && refetchPendingTasks()
      refetch.mannaBalance()
    } catch (error) {
      toast.error('Error creating task. Please try again.')
    }
  }

  useEffect(() => {
    setHasChangedGenerator && setHasChangedGenerator(true)
  }, [generator, setHasChangedGenerator])

  const renderFormFields = (parameters: GeneratorParameter[]) => {
    return parameters.map(parameter => {
      return (
        <div
          key={parameter.name}
          className="bg-gray-100 dark:bg-gray-900 p-4 rounded-md mb-6"
        >
          {(parameter.allowedValues && parameter.allowedValues.length > 0) ||
          parameter.allowedValuesFrom ? (
            <OptionParameter
              key={parameter.name}
              form={form}
              parameter={parameter}
            />
          ) : (
            <>
              {typeof parameter.default === 'number' ? (
                <SliderParameter
                  key={parameter.name}
                  form={form}
                  parameter={parameter}
                />
              ) : (
                <>
                  {parameter.mediaUpload ? (
                    <UploadParameter
                      key={parameter.name}
                      form={form}
                      parameter={parameter}
                    />
                  ) : (
                    <StringParameter
                      key={parameter.name}
                      form={form}
                      parameter={parameter}
                      onStringArrayChange={onStringArrayChange}
                    />
                  )}
                </>
              )}
            </>
          )}
          {/* {parameters[key].name == 'lora' && (
            <>
              <Switch checked={allLoras} onChange={setAllLoras} />
              &nbsp;&nbsp;Include all Loras
            </>
          )} */}
        </div>
      )
    })
  }

  return (
    <Form form={form} name="generate" onFinish={handleFinish}>
      <Card
        type="inner"
        title={
          <div className="py-4">
            <h3>/{generator.generatorName}</h3>
            <span style={{ color: 'gray' }}>{generator.description}</span>
          </div>
        }
        actions={[
          <div className="flex px-6">
            <Button
              type="primary"
              icon={<ExperimentOutlined />}
              htmlType="submit"
              size="large"
            >
              Create
            </Button>
          </div>,
        ]}
      >
        {renderFormFields(requiredParameters)}
        {optionalParameters.length > 0 && (
          <>
            {showOptional ? (
              <Button onClick={() => setShowOptional(false)} className="mb-4">
                <UpCircleOutlined />
                Hide optional settings
              </Button>
            ) : (
              <Button onClick={() => setShowOptional(true)}>
                <DownCircleOutlined />
                Show optional settings
              </Button>
            )}
          </>
        )}
        {showOptional && renderFormFields(optionalParameters)}
      </Card>
    </Form>
  )
}

export default GeneratorForm
