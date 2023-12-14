import ParameterAddon from '@/components/Creation/CreationInterface/parameters/ParameterAddon'
import MinusOutlined from '@ant-design/icons/MinusOutlined'
import PlusOutlined from '@ant-design/icons/PlusOutlined'
import { GeneratorParameter } from '@edenlabs/eden-sdk'
import { Badge, Button, Col, Form, FormInstance, Input, Row } from 'antd'
import React, { useEffect, useState } from 'react'

const StringParameter = (props: {
  form: FormInstance
  parameter: GeneratorParameter
  onStringArrayChange: (parameterName: string, newValues: string[]) => void
}) => {
  const [values, setValues] = useState(
    new Array(props.parameter.minLength || 1).fill(props.parameter.default),
  )

  useEffect(() => {
    if (props.parameter.default && props.parameter.default.length) {
      handleChange(props.parameter.default)
    }
  }, [props.parameter.default])

  const handleAddInput = () => {
    setValues([...values, ''])
  }

  const handleChange = (newValue: string[]) => {
    setValues(newValue)
    props.onStringArrayChange(props.parameter.name, newValue)
    props.form.setFieldsValue({ [props.parameter.name]: newValue })
  }

  const isArray = Array.isArray(props.parameter.default)

  return (
    <div className="h-full w-full relative">
      {isArray ? (
        <>
          <div className="w-full md:w-auto">
            <ParameterAddon
              title={props.parameter.label}
              info={`(max. ${props.parameter.maxLength})`}
              textArea={true}
            />
          </div>
          <Form.Item
            className="mb-1 w-full"
            name={props.parameter.name}
            rules={[
              {
                required: props.parameter.isRequired,
                message: `${props.parameter.label} required`,
              },
            ]}
          >
            <>
              {values.map((value, index) => (
                <Row key={index} className="mb-2">
                  <Badge
                    className="flex w-full pointer-events-none"
                    count={index + 1}
                    color={'#A4A4A4'}
                  >
                    <Col flex="auto" className="pointer-events-auto">
                      <Input.TextArea
                        autoSize
                        className="font-mono !rounded-tr-none"
                        defaultValue={props.parameter.default[index]}
                        onChange={event => {
                          const newValues = [...values]
                          newValues[index] = event.target.value
                          handleChange(newValues)
                        }}
                      />
                    </Col>
                    <Col className="pointer-events-auto">
                      {values.length > (props.parameter.minLength || 1) && (
                        <Button
                          className="!px-1 bg-gray-100 dark:bg-gray-950 rounded-bl-none rounded-tl-none border-l-0"
                          onClick={() => {
                            const newValues = [...values]
                            newValues.splice(index, 1)
                            handleChange(newValues)
                          }}
                        >
                          <MinusOutlined />
                        </Button>
                      )}
                    </Col>
                  </Badge>
                </Row>
              ))}
              <Row>
                <Col>
                  {!props.parameter.maxLength ||
                    (values.length < props.parameter.maxLength && (
                      <Button onClick={handleAddInput} className="!px-2">
                        <PlusOutlined />
                      </Button>
                    ))}
                </Col>
              </Row>
            </>
          </Form.Item>
        </>
      ) : (
        <div className="">
          <ParameterAddon title={props.parameter.label} textArea={true} />
          <Form.Item
            className="mb-1 font-mono w-full"
            name={props.parameter.name}
            initialValue={props.parameter.default}
            rules={[
              {
                required: props.parameter.isRequired,
                message: `${props.parameter.label} required`,
              },
            ]}
          >
            <Input.TextArea
              autoSize
              className="with-addon"
              spellCheck={false}
            />
          </Form.Item>
        </div>
      )}
    </div>
  )
}

export default StringParameter
