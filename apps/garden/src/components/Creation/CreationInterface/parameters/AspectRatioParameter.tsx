import CropLandscapeIcon from '@mui/icons-material/CropLandscape'
import CropPortraitIcon from '@mui/icons-material/CropPortrait'
import { Form, FormInstance, Popover, Slider } from 'antd'
import React, { useEffect, useState } from 'react'

type PresetResolution = {
  width: number
  height: number
  aspectRatio: string //'21:9'
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

const AspectRatioParameter = ({
  form,
  onChange,
}: {
  form: FormInstance
  onChange: (newVal: PresetResolution) => void
}) => {
  const [displayValue, setDisplayValue] = useState<string>()

  useEffect(() => {
    if (!form) return
    const currentValue = form.getFieldValue('ui-aspect-ratio')
    if (typeof currentValue !== 'undefined') {
      setDisplayValue(
        presetResolutions[form.getFieldValue('ui-aspect-ratio')].aspectRatio,
      )
    }
  }, [form])

  const onChangeHandler = (newVal: PresetResolution) => {
    setDisplayValue(newVal.aspectRatio)
    onChange && onChange(newVal)
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
        name="ui-aspect-ratio"
        className="mt-0 mb-0"
        dependencies={['width', 'height']}
        rules={[
          () => ({
            validator(rule, incomingValue) {
              setDisplayValue(presetResolutions[incomingValue].aspectRatio)
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
