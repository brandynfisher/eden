import { ParameterAddon } from '@/components/Creation/CreationInterface/parameters/SamplesParameter'
import { GeneratorParameter } from '@edenlabs/eden-sdk'
import { Form, FormInstance, InputNumber } from 'antd'
import React, { FocusEvent, useEffect } from 'react'

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
    <div className="parameter parameter--slider flex items-center">
      <ParameterAddon
        title={props.parameter.name}
        description={props.parameter.description}
      />
      <Form.Item
        className="my-0 w-full"
        name={props.parameter.name}
        initialValue={props.parameter.default}
        rules={[
          {
            required: props.parameter.isRequired,
            message: `${props.parameter.label} required`,
          },
        ]}
      >
        <InputNumber
          className="w-full"
          min={props.parameter.minimum}
          max={props.parameter.maximum}
          onChange={onChange}
          onBlur={onBlur}
        />
      </Form.Item>
    </div>
  )
}

export default NumberParameter
