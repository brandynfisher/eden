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

// const createMarksObject = (numEntries: number): Record<string, React.ReactNode> => {
//   const obj: Record<string, React.ReactNode> = {}
//
//   for (let i = 0; i < numEntries; i++) {
//     obj[i.toString()] = <></>;  // Set a React Fragment with optional label for each entry
//   }
//
//   return obj
// }

const getPresetResolutionIndex = (width: number, height: number) => {
  const aspectRatio = width / height
  const aspectIndex = presetItems['aspectRatio'].indexOf(
    closest(aspectRatio || 0, presetItems['aspectRatio']),
  )
  return aspectIndex !== -1 ? aspectIndex : 0
}

const AspectRatioParameter = ({
  form,
  name,
  onFieldChange,
}: {
  form: FormInstance
  name: string
  onFieldChange?: () => void
}) => {
  const aspectRatioValue = Form.useWatch('ui-aspect-ratio', form)

  const [values, setValues] = useState<{
    fieldValue: number | undefined
    displayValue: string | undefined
  }>({
    fieldValue: undefined,
    displayValue: undefined,
  })

  useEffect(() => {
    // console.log('AR -- useEffect:aspectRatioValue', { aspectRatioValue })

    if (typeof aspectRatioValue !== 'undefined') {
      // const presetIndex = getPresetResolutionIndex(width, height)
      // setTimeout(() => {
      // Update both fields at once
      // console.log('setValues::aspectRatioValue', aspectRatioValue)
      setValues({
        fieldValue: aspectRatioValue,
        displayValue: presetResolutions[aspectRatioValue].aspectRatio,
      })
      // }, 50);
    }
  }, [aspectRatioValue])

  // useEffect(() => {
  //   console.log('useEffect::initialValue', initialValue)
  //   if (!initialValue) {
  //     return;
  //   }
  //   const presetIndex = getPresetResolutionIndex(
  //     initialValue.width,
  //     initialValue.height,
  //   );
  //   // Update both fields at once
  //   setValues({
  //     fieldValue: presetIndex,
  //     displayValue: presetResolutions[presetIndex].aspectRatio,
  //   });
  // }, [initialValue]);

  // useEffect(() => {
  //   onAfterChangeHandler(initialValue)
  // }, [initialValue])

  const onChangeHandler = (newVal: PresetResolution) => {
    // console.log('onChangeHander', newVal)
    const presetIndex = getPresetResolutionIndex(newVal.width, newVal.height)
    setValues({
      fieldValue: presetIndex,
      displayValue: presetResolutions[presetIndex].aspectRatio,
    })
    // form.setFieldsValue({ ['width']: newVal.width })
    // form.setFieldsValue({ ['height']: newVal.height })
    // onFieldChange && onFieldChange()
  }

  const onAfterChangeHandler = (newVal: PresetResolution) => {
    form.setFieldsValue({ ['width']: newVal.width })
    form.setFieldsValue({ ['height']: newVal.height })
    onFieldChange && onFieldChange()
  }

  return (
    <div className="mt-2">
      <div className="flex justify-stretch font-mono items-center">
        <Popover content={<div>Landscape</div>} trigger={['click', 'hover']}>
          <CropLandscapeIcon fontSize="large" className="dark:text-gray-500" />
        </Popover>
        <div className="flex mx-auto dark:text-gray-300">
          {values.displayValue}
        </div>
        <Popover content={<div>Portrait</div>} trigger={['click', 'hover']}>
          <CropPortraitIcon fontSize="large" className="dark:text-gray-500" />
        </Popover>
      </div>
      <Form.Item
        initialValue={aspectRatioValue}
        name={name}
        className="mt-0 mb-0"
        dependencies={['width', 'height']}
        rules={[
          {
            required: false,
          },
          () => ({
            //@ts-ignore
            validator(rule, incomingValue) {
              // console.log({incomingValue})
              setValues({
                fieldValue: incomingValue,
                displayValue: presetResolutions[incomingValue].aspectRatio,
              })
              return Promise.resolve()
            },
          }),
        ]}
      >
        <Slider
          value={values.fieldValue}
          trackStyle={{ display: 'none' }}
          step={1}
          min={0}
          // marks={createMarksObject(presetResolutions.length)}
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
          onAfterChange={newVal =>
            onAfterChangeHandler(presetResolutions[newVal])
          }
        />
      </Form.Item>
    </div>
  )
}

export default AspectRatioParameter
