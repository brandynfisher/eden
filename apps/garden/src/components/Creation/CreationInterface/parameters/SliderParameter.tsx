import ParameterLabel from '@/components/Creation/CreationInterface/parameters/ParameterLabel'
import { GeneratorParameter } from '@edenlabs/eden-sdk'
import { Form, FormInstance, InputNumber, Slider } from 'antd'
import { FocusEvent, useEffect, useState } from 'react'

const SliderParameter = (props: {
  form: FormInstance
  parameter: GeneratorParameter
}) => {
  const [fieldValue, setFieldValue] = useState<number | null>(
    props.parameter.default,
  )

  const onChange = (newValue: number | null) => {
    setFieldValue(newValue)
  }

  const setFormValue = (newValue: number | null) => {
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
    setFormValue(fieldValue)
  }, [fieldValue])

  useEffect(() => {
    onChange(props.parameter.default)
  }, [props.parameter.default])

  return (
    <>
      <ParameterLabel
        name={props.parameter.name}
        text={props.parameter.label}
        description={props.parameter.description}
      />
      <div className="flex gap-2 mt-2">
        <Slider
          className="flex-grow"
          value={fieldValue || 0}
          min={props.parameter.minimum}
          max={props.parameter.maximum}
          step={props.parameter.step ? props.parameter.step : 1}
          onChange={onChange}
        />
        <InputNumber
          value={fieldValue || 0}
          min={props.parameter.minimum}
          max={props.parameter.maximum}
          onChange={onChange}
          onBlur={onBlur}
          className="w-20"
        />
      </div>
      <Form.Item
        className="mb-1 hidden"
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
              (props.parameter.minimum && value < props.parameter.minimum) ||
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
        <InputNumber value={fieldValue} />
      </Form.Item>
    </>
  )
}

export default SliderParameter
