import OptionParameter from '@/components/CreationInterface/parameters/OptionParameter'
import SliderParameter from '@/components/CreationInterface/parameters/SliderParameter'
import StringParameter from '@/components/CreationInterface/parameters/StringParameter'
import UploadParameter from '@/components/CreationInterface/parameters/UploadParameter'
import { useBalance } from '@/hooks/useBalance'
import { CreationNotificationContext } from '@/providers/CreationNotificationProvider'
import { UserContext } from '@/providers/UserProvider'
import {
  DownCircleOutlined,
  RightCircleOutlined,
  UpCircleOutlined,
} from '@ant-design/icons'
import {
  Generator,
  GeneratorParameter,
} from '@eden-labs/eden-sdk/dist/responses/GeneratorsGetResponse'
import { Button, Form } from 'antd'
import axios from 'axios'
import React, { useContext, useEffect } from 'react'
import { toast } from 'react-toastify'

const GeneratorForm = ({ generator }: { generator: Generator }) => {
  const {
    taskIds,
    setTaskIds,
    setActiveTaskId,
    setHasChangedGenerator,
    refetchPendingTasks,
  } = useContext(CreationNotificationContext)
  const { isAuthenticated } = useContext(UserContext)
  const { refetchMannaBalance } = useBalance({ isAuthenticated })
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

  const handleFinish = async () => {
    const response = await axios.post('/api/tasks/create', {
      generatorName: generator.generatorName,
      config: form.getFieldsValue(),
    })
    toast.success('Task created!')
    const { taskId } = response.data
    setActiveTaskId && setActiveTaskId(taskId)
    setTaskIds && setTaskIds([...taskIds, taskId])
    setHasChangedGenerator && setHasChangedGenerator(false)
    refetchPendingTasks && refetchPendingTasks()
    refetchMannaBalance()
  }

  useEffect(() => {
    setHasChangedGenerator && setHasChangedGenerator(true)
  }, [generator, setHasChangedGenerator])

  const renderFormFields = (parameters: GeneratorParameter[]) => {
    return parameters.map(parameter => {
      return (
        <div
          key={parameter.name}
          style={{
            paddingBottom: 5,
            marginBottom: 10,
            borderBottom: '1px solid #ccc',
          }}
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
    <>
      <div
        style={{
          backgroundColor: '#eee',
          padding: 10,
          borderRadius: 10,
          marginBottom: 10,
          width: '90%',
        }}
      >
        <h2>/{generator.generatorName}</h2>
        <h3>
          <span style={{ color: 'gray' }}>{generator.description}</span>
        </h3>
      </div>
      <div style={{ padding: 10 }}>
        <Form form={form} name="generate" onFinish={handleFinish}>
          {renderFormFields(requiredParameters)}
          <h3 style={{ padding: 5 }}>
            {optionalParameters.length > 0 && (
              <>
                {showOptional ? (
                  <Button onClick={() => setShowOptional(false)}>
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
          </h3>
          {showOptional && renderFormFields(optionalParameters)}
          <Form.Item>
            <Button
              icon={<RightCircleOutlined />}
              htmlType="submit"
              size="large"
            >
              Create
            </Button>
          </Form.Item>
        </Form>
      </div>
    </>
  )
}

export default GeneratorForm
