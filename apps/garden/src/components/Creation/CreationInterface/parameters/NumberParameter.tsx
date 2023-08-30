import { GeneratorParameter } from '@edenlabs/eden-sdk'
import { Col, Form, FormInstance, InputNumber, Row } from 'antd'
import { FocusEvent, useEffect } from 'react'

const NumberParameter = (props: {
  form: FormInstance
  parameter: GeneratorParameter
}) => {
  const onChange = (newValue: number | null) => {
    if (newValue !== null) {
      props.form.setFieldsValue({ [props.parameter.name]: newValue })
    }
  }

  const onBlur = (e: FocusEvent<HTMLInputElement>) => {
    const { value } = e.target
    if (value === '' && props.parameter.minimum !== undefined) {
      onChange(null)
    }
  }

  useEffect(() => {
    onChange(props.parameter.default)
  }, [props.parameter.default])

  return (
    <>
      <Row>
        <Col style={{ marginLeft: 10 }} className="flex items-end w-full">
          <Form.Item
            className="w-full"
            style={{ marginBottom: 5 }}
            label={`${props.parameter.label}`}
            name={`${props.parameter.name}`}
            initialValue={props.parameter.default}
            rules={[
              {
                required: props.parameter.isRequired,
                message: `${props.parameter.label} required`,
              },
            ]}
          >
            <InputNumber
              className="self-end"
              style={{ marginBottom: 5 }}
              min={props.parameter.minimum}
              max={props.parameter.maximum}
              onChange={onChange}
              onBlur={onBlur}
            />
          </Form.Item>
        </Col>
      </Row>
      <Row>
        <span style={{ color: 'gray' }}>{props.parameter.description}</span>
      </Row>
    </>
  )
}

export default NumberParameter
