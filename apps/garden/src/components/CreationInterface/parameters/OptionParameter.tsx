import { GeneratorParameter } from '@eden-labs/eden-sdk'
import { Col, Form, FormInstance, Row, Select, Switch } from 'antd'
import { useState } from 'react'

const OptionParameter = (props: {
  form: FormInstance
  parameter: GeneratorParameter
}) => {
  const [value, setValue] = useState(props.parameter.default)

  const allowedValues = props.parameter.allowedValues
  const options = allowedValues ? allowedValues.map(value => ({ value })) : []

  const onChange = (newValue: number | null) => {
    if (newValue !== null) {
      setValue(newValue)
      props.form.setFieldsValue({ [props.parameter.name]: newValue })
    }
  }

  const onSwitchChange = (newValue: boolean) => {
    setValue(newValue)
    props.form.setFieldsValue({ [props.parameter.name]: newValue })
  }

  return (
    <>
      <Row>
        <Col span={12}>
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
            {typeof props.parameter.default === 'boolean' ? (
              <Switch checked={value} onChange={onSwitchChange} />
            ) : (
              <Select
                value={value}
                style={{ width: '40%' }}
                options={options}
                onChange={onChange}
              />
            )}
          </Form.Item>
        </Col>
      </Row>
      <Row>
        <span style={{ color: 'gray' }}>{props.parameter.description}</span>
      </Row>
    </>
  )
}

export default OptionParameter
