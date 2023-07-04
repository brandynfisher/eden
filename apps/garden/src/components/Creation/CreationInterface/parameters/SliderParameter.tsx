import { GeneratorParameter } from '@eden-labs/eden-sdk'
import { Col, Form, FormInstance, InputNumber, Row, Slider } from 'antd'
import { useState } from 'react'

const SliderParameter = (props: {
  form: FormInstance
  parameter: GeneratorParameter
}) => {
  const [value, setValue] = useState(props.parameter.default)

  const onChange = (newValue: number | null) => {
    if (newValue !== null) {
      setValue(newValue)
      props.form.setFieldsValue({ [props.parameter.name]: newValue })
    }
  }

  return (
    <>
      <Row>
        <Col flex="auto">
          <Form.Item
            style={{ marginBottom: 5 }}
            label={props.parameter.label}
            name={props.parameter.name}
            initialValue={props.parameter.default}
            rules={[
              {
                required: props.parameter.isRequired,
                message: `${props.parameter.label} required`,
              },
            ]}
          >
            <Slider
              value={value}
              min={props.parameter.minimum}
              max={props.parameter.maximum}
              step={props.parameter.step ? props.parameter.step : 1}
              onChange={(newValue: number) => setValue(newValue)}
            />
          </Form.Item>
        </Col>
        <Col style={{ marginLeft: 10 }} className="flex items-end">
          <InputNumber
            style={{ marginBottom: 5 }}
            value={value}
            min={props.parameter.minimum}
            max={props.parameter.maximum}
            onChange={onChange}
          />
        </Col>
      </Row>
      <Row>
        <span style={{ color: 'gray' }}>{props.parameter.description}</span>
      </Row>
    </>
  )
}

export default SliderParameter
