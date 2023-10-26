import ParameterLabel from '@/components/Creation/CreationInterface/parameters/ParameterLabel'
import { GeneratorParameter } from '@edenlabs/eden-sdk'
import { Form, FormInstance, Select, Switch } from 'antd'
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
      <Form.Item
        label={
          <ParameterLabel
            text={props.parameter.label}
            description={props.parameter.description}
          />
        }
        className="mb-1"
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
            style={{ maxWidth: '50%' }}
            options={options}
            onChange={onChange}
            className="flex ml-auto"
          />
        )}
      </Form.Item>
    </>
  )
}

export default OptionParameter
