import {
  closest,
  presetItems,
} from '@/components/Creation/CreationInterface/parameters/AspectRatioParameter'
import ParameterAddon from '@/components/Creation/CreationInterface/parameters/ParameterAddon'
import { GeneratorParameter } from '@edenlabs/eden-sdk'
import { debounce } from '@mui/material/utils'
import { Form, FormInstance, InputNumber, Slider } from 'antd'
import React, { FocusEvent, useCallback, useEffect, useState } from 'react'

const SliderParameter = (props: {
  form: FormInstance
  parameter: GeneratorParameter
  onFieldChange?: () => void
}) => {
  const [fieldValue, setFieldValue] = useState<number>(
    props.parameter.default || 0,
  )

  const sliderValue = Form.useWatch(props.parameter.name, props.form)

  const onChange = (newValue: number | null, triggerLinked?: boolean) => {
    // console.log('onChange', newValue)
    // console.log(source, newValue)
    if (!newValue) return
    setFieldValue(newValue)
    props.onFieldChange && props.onFieldChange()
    // specialChangeHandler()

    if (triggerLinked) {
      onAfterChange()
    }
  }

  const setFormValue = (newValue: number | null) => {
    if (newValue !== null) {
      props.form.setFieldsValue({
        [props.parameter.name]: newValue,
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

  // useEffect(() => {
  //   // console.log({sliderValue})
  //   // if (typeof sliderValue !== 'undefined') {
  //   setFieldValue(prev => {
  //     console.log('SL -- useEffect::sliderValue', { sliderValue, prev, fieldValue })
  //
  //     if (
  //       props.parameter.name === 'width' ||
  //       props.parameter.name === 'height'
  //     ) {
  //       if (sliderValue === prev && sliderValue === fieldValue) {
  //         console.log('ALL THEM THINGS', { sliderValue })
  //         return prev
  //       }
  //
  //       if (sliderValue !== prev && fieldValue === prev) {
  //         return sliderValue
  //       }
  //     }
  //
  //     return prev
  //   })
  //   // setFormValue(sliderValue)
  //   // }
  // }, [sliderValue])
  const debouncedSave = useCallback(
    debounce(setFieldValue, 300),
    [], // will be created only once initially
  )
  useEffect(() => {
    debouncedSave((prev: number) => {
      if (
        props.parameter.name === 'width' ||
        props.parameter.name === 'height'
      ) {
        if (sliderValue === prev && sliderValue === fieldValue) {
          return prev
        }

        if (sliderValue !== prev && fieldValue === prev) {
          return sliderValue
        }
      }

      return prev
    })
    return () => debouncedSave.clear()
  }, [debouncedSave, sliderValue])

  useEffect(() => {
    setFormValue(fieldValue)
  }, [fieldValue])

  useEffect(() => {
    onChange(props.parameter.default)
    onAfterChange()
  }, [props.parameter.default])

  const specialChangeHandler = () => {
    if (props.parameter.name === 'width' || props.parameter.name === 'height') {
      const values = props.form.getFieldsValue(['width', 'height'])
      // console.log({values})
      if (values.height === 0 || values.width === 0) {
        // console.log('Dimension should not be 0!');
        return
      }
      const aspectRatio = values.width / values.height

      const aspectIndex = presetItems['aspectRatio'].indexOf(
        closest(aspectRatio || 0, presetItems['aspectRatio']),
      )
      props.form.setFieldsValue({ 'ui-aspect-ratio': aspectIndex })
    }
  }

  const onAfterChange = () => {
    if (props.parameter.name === 'width' || props.parameter.name === 'height') {
      props.onFieldChange && props.onFieldChange()
      specialChangeHandler()
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
          onAfterChange={onAfterChange}
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
            onChange={val => onChange(val, true)}
            onBlur={onBlur}
            step={props.parameter.step ? props.parameter.step : 1}
          />
        </Form.Item>
      </div>
    </div>
  )
}

export default SliderParameter
