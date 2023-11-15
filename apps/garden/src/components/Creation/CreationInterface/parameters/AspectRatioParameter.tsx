import CropLandscapeIcon from '@mui/icons-material/CropLandscape'
import CropPortraitIcon from '@mui/icons-material/CropPortrait'
import { Form, FormInstance, Popover, Slider } from 'antd'
import React, { useEffect, useState } from 'react'

type PresetResolution = {
  width: number
  height: number
  aspectRatio: string //'21:9'
}

export function closest(needle: number, haystack: number[]) {
  return haystack.reduce((a, b) => {
    let aDiff = Math.abs(a - needle)
    let bDiff = Math.abs(b - needle)

    if (aDiff == bDiff) {
      return a > b ? a : b
    } else {
      return bDiff < aDiff ? b : a
    }
  })
}

export const presetResolutions: PresetResolution[] = [
  {
    width: 1536,
    height: 640,
    aspectRatio: '21:9',
  },
  {
    width: 1344,
    height: 768,
    aspectRatio: '16:9',
  },
  {
    width: 1216,
    height: 832,
    aspectRatio: '3:2',
  },
  {
    width: 1152,
    height: 896,
    aspectRatio: '5:4',
  },
  {
    width: 1024,
    height: 1024,
    aspectRatio: '1:1',
  },
  {
    width: 896,
    height: 1152,
    aspectRatio: '4:5',
  },
  {
    width: 832,
    height: 1216,
    aspectRatio: '2:3',
  },
  {
    width: 768,
    height: 1344,
    aspectRatio: '9:16',
  },
  {
    width: 640,
    height: 1536,
    aspectRatio: '9:21',
  },
]

export const presetItems = {
  width: presetResolutions.map(pres => pres.width),
  height: presetResolutions.map(pres => pres.height),
  aspectRatio: presetResolutions.map(pres => pres.width / pres.height),
}

const getPresetResolutionIndex = (width: number, height: number) => {
  const aspectRatio = width / height
  const aspectIndex = presetItems['aspectRatio'].indexOf(
    closest(aspectRatio || 0, presetItems['aspectRatio']),
  )
  return aspectIndex
}

const AspectRatioParameter = ({
  form,
  name,
  initialValue,
}: {
  form: FormInstance
  name: string
  initialValue?: { width: number; height: number }
}) => {
  const [displayValue, setDisplayValue] = useState<string>()
  const [initialFieldValue, setInitialFieldValue] = useState<number>()

  useEffect(() => {
    if (!form) return
    const currentValue = form.getFieldValue(name)
    if (typeof currentValue !== 'undefined') {
      setDisplayValue(presetResolutions[form.getFieldValue(name)].aspectRatio)
    }
  }, [form])

  useEffect(() => {
    console.log({ initialValue })
    if (!initialValue) {
      setDisplayValue(presetResolutions[4].aspectRatio)
      return
    }
    const presetIndex = getPresetResolutionIndex(
      initialValue.width,
      initialValue.height,
    )
    console.log({ presetIndex })
    setInitialFieldValue(presetIndex)
    setDisplayValue(presetResolutions[presetIndex].aspectRatio)
  }, [initialValue])

  const onChangeHandler = (newVal: PresetResolution) => {
    setDisplayValue(newVal.aspectRatio)
    form.setFieldsValue({ ['width']: newVal.width })
    form.setFieldsValue({ ['height']: newVal.height })
  }

  return (
    <div className="mt-2">
      <div className="flex justify-stretch font-mono items-center">
        <Popover content={<div>Landscape</div>} trigger={['click', 'hover']}>
          <CropLandscapeIcon fontSize="large" className="dark:text-gray-500" />
        </Popover>
        <div className="flex mx-auto dark:text-gray-300">{displayValue}</div>
        <Popover content={<div>Portrait</div>} trigger={['click', 'hover']}>
          <CropPortraitIcon fontSize="large" className="dark:text-gray-500" />
        </Popover>
      </div>
      <Form.Item
        name={name}
        className="mt-0 mb-0"
        dependencies={['width', 'height']}
        initialValue={initialFieldValue}
        rules={[
          () => ({
            validator(rule, incomingValue) {
              setDisplayValue(presetResolutions[incomingValue].aspectRatio)
              return Promise.resolve()
            },
          }),
        ]}
      >
        <Slider
          trackStyle={{ display: 'none' }}
          step={1}
          min={0}
          tooltip={{
            placement: 'bottom',
            formatter: val => (
              <div>
                {typeof val !== 'undefined'
                  ? `${presetResolutions[val].width} × ${presetResolutions[val].height}`
                  : ''}
              </div>
            ),
          }}
          max={presetResolutions.length - 1}
          onChange={newVal => onChangeHandler(presetResolutions[newVal])}
        />
      </Form.Item>
    </div>
  )
}

export default AspectRatioParameter
