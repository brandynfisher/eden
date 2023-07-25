import { GeneratorParameter } from '@edenlabs/eden-sdk'
import { Col, Form, FormInstance, InputNumber, Row, Slider } from 'antd'
import { FocusEvent, useEffect } from 'react'

const SliderParameter = (props: {
  form: FormInstance
  parameter: GeneratorParameter
}) => {
  const onChange = (newValue: number | null) => {
    if (newValue !== null) {
      props.form.setFieldsValue({ [props.parameter.name]: newValue })
      props.form.setFieldsValue({
        [`${props.parameter.name}--preset`]: newValue,
      })
    }
  }

  const onBlur = (e: FocusEvent<HTMLInputElement>) => {
    const { value } = e.target
    if (value === '' && props.parameter.minimum !== undefined) {
      onChange(props.parameter.minimum)
    }
  }

  useEffect(() => {
    onChange(props.parameter.default)
  }, [props.parameter.default])

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
              {
                validator: (_, value) =>
                  isNaN(value) ||
                  (props.parameter.minimum &&
                    value < props.parameter.minimum) ||
                  (props.parameter.maximum && value > props.parameter.maximum)
                    ? Promise.reject(
                        new Error(
                          'Value must be a number and within the valid range',
                        ),
                      )
                    : Promise.resolve(),
              },
            ]}
          >
            <Slider
              min={props.parameter.minimum}
              max={props.parameter.maximum}
              step={props.parameter.step ? props.parameter.step : 1}
              onChange={(newValue: number) => {
                onChange(newValue)
              }}
            />
          </Form.Item>
        </Col>

        <Col style={{ marginLeft: 10 }} className="flex items-end">
          <Form.Item
            style={{ marginBottom: 5 }}
            name={`${props.parameter.name}--preset`}
            initialValue={props.parameter.default}
            rules={[
              {
                required: props.parameter.isRequired,
                message: `${props.parameter.label} required`,
              },
            ]}
          >
            <InputNumber
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

export default SliderParameter
