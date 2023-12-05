import {
  closest,
  presetItems,
} from '@/components/Creation/CreationInterface/parameters/AspectRatioParameter'
import ParameterAddon from '@/components/Creation/CreationInterface/parameters/ParameterAddon'
import { GeneratorParameter } from '@edenlabs/eden-sdk'
import { Form, FormInstance, InputNumber, Slider } from 'antd'
import React, { FocusEvent, useEffect, useState } from 'react'

const SliderParameter = (props: {
  form: FormInstance
  parameter: GeneratorParameter
  onFieldChange?: Function
}) => {
  const [fieldValue, setFieldValue] = useState<number>(
    props.parameter.default || 0,
  )

  const sliderValue = Form.useWatch(props.parameter.name, props.form)

  useEffect(() => {
    // if (sliderValue !== fieldValue) {
    //   return
    // }

    // console.log('useEffect', sliderValue, fieldValue)
    setFieldValue(prev => (prev === sliderValue ? sliderValue : prev))
    setFormValue(fieldValue !== sliderValue ? sliderValue : fieldValue)
  }, [sliderValue])

  const onChange = (newValue: number | null) => {
    if (!newValue) return
    setFieldValue(newValue)
    props.onFieldChange && props.onFieldChange()
    specialChangeHandler()
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

  const specialChangeHandler = () => {
    if (props.parameter.name === 'width' || props.parameter.name === 'height') {
      // console.log('is width/height')
      // console.log(presetItems)

      // console.log({index})
      const values = props.form.getFieldsValue(['width', 'height'])
      const aspectRatio = values.width / values.height
      // console.log({aspectRatio})

      // console.log(props.form.getFieldsValue(['ui-aspect-ratio']))

      const aspectIndex = presetItems['aspectRatio'].indexOf(
        closest(aspectRatio || 0, presetItems['aspectRatio']),
      )
      // console.log({aspectIndex})
      // const heightIndex = presetItems['height'].indexOf(closest(values.height || 0, presetItems['height']))
      props.form.setFieldsValue({ 'ui-aspect-ratio': aspectIndex })
    }
  }

  return (
    <div className="parameter parameter--slider flex items-center">
      <ParameterAddon
        title={props.parameter.label}
        description={props.parameter.description}
      />
      <div className="flex items-center w-full parameter__addon !bg-stone-50 dark:!bg-stone-950 border border-r-0 border-solid rounded-tr-md rounded-br-md border-gray-200 dark:border-gray-700">
        <Slider
          className="flex-grow"
          value={fieldValue}
          min={props.parameter.minimum}
          max={props.parameter.maximum}
          step={props.parameter.step ? props.parameter.step : 1}
          onChange={onChange}
        />
        <Form.Item
          className="my-0"
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
          <InputNumber
            value={fieldValue}
            min={props.parameter.minimum}
            max={props.parameter.maximum}
            onChange={onChange}
            onBlur={onBlur}
          />
        </Form.Item>
      </div>
    </div>
  )
}

export default SliderParameter
