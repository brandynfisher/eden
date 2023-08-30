import { MinusOutlined, PlusOutlined } from '@ant-design/icons'
import { GeneratorParameter } from '@edenlabs/eden-sdk'
import { Button, Col, Form, FormInstance, Input, Row } from 'antd'
import React, { useState } from 'react'

const StringParameter = (props: {
  form: FormInstance
  parameter: GeneratorParameter
  onStringArrayChange: (parameterName: string, newValues: string[]) => void
}) => {
  // const [value, setValue] = useState('')
  const [values, setValues] = useState(
    new Array(props.parameter.minLength || 1).fill(props.parameter.default),
  )

  const handleAddInput = () => {
    setValues([...values, ''])
  }

  const handleChange = (newValue: string[]) => {
    setValues(newValue)
    props.onStringArrayChange(props.parameter.name, newValue)
  }

  const isArray = Array.isArray(props.parameter.default)

  return (
    <>
      {isArray ? (
        <>
          <Form.Item
            label={props.parameter.label}
            name={props.parameter.name}
            rules={[
              {
                required: props.parameter.isRequired,
                message: `${props.parameter.label} required`,
              },
            ]}
          >
            <div>
              {values.map((value, index) => (
                <Row key={index} className="mb-2">
                  <Col flex="auto" className="mr-1">
                    <Input.TextArea
                      autoSize
                      className="font-mono"
                      defaultValue={props.parameter.default[index]}
                      onChange={event => {
                        const newValues = [...values]
                        newValues[index] = event.target.value
                        handleChange(newValues)
                      }}
                    />
                  </Col>
                  <Col>
                    {values.length > (props.parameter.minLength || 1) && (
                      <Button
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
                </Row>
              ))}
              <Row>
                <Col>
                  {!props.parameter.maxLength ||
                    (values.length < props.parameter.maxLength && (
                      <Button onClick={handleAddInput}>
                        <PlusOutlined />
                      </Button>
                    ))}
                </Col>
              </Row>
            </div>
          </Form.Item>
          <Row>
            <Col>
              <span style={{ color: 'gray' }}>
                {props.parameter.description}
              </span>
            </Col>
          </Row>
        </>
      ) : (
        <>
          <Form.Item
            style={{ marginBottom: 5 }}
            label={props.parameter.label}
            name={props.parameter.name}
            initialValue={props.parameter.default}
            className="font-mono"
            rules={[
              {
                required: props.parameter.isRequired,
                message: `${props.parameter.label} required`,
              },
            ]}
          >
            <Input.TextArea autoSize />
          </Form.Item>
          <Row>
            <span style={{ color: 'gray' }}>{props.parameter.description}</span>
          </Row>
        </>
      )}
    </>
  )
}

export default StringParameter
