import { Form, FormInstance, Input, Popover, Select } from 'antd'
import React from 'react'

const InputAddon = ({
  title,
  textArea,
  info,
}: {
  title: string
  info?: string
  textArea?: boolean
}) => {
  return (
    <div className={`parameter ${textArea ? 'parameter--textarea' : ''}`}>
      <Input
        style={{
          width: !textArea ? 68 : '100%',
          borderTopRightRadius: textArea ? '6px' : 0,
          borderBottomRightRadius: 0,
          // pointerEvents: 'none'
        }}
        className={`parameter__addon h-full !px-2 !m-0 text-xs !bg-stone-400 dark:!bg-stone-900 ${
          textArea
            ? '!border-b-0 rounded-bl-none rounded-b-none rounded-br-none'
            : 'border-r-0'
        }`}
        placeholder={info ? title + ' ' + info : title}
        disabled
      />
    </div>
  )
}

export const ParameterAddon = ({
  title,
  info,
  description,
  textArea,
}: {
  title: string
  info?: string
  description?: string
  textArea?: boolean
}) => {
  if (!description) {
    return (
      <div className="h-full">
        <InputAddon title={title} info={info} textArea={textArea} />
      </div>
    )
  }

  return (
    <Popover
      content={<div>{description}</div>}
      title={title}
      trigger={['click', 'hover']}
    >
      <div className="h-full">
        <InputAddon title={title} info={info} textArea={textArea} />
      </div>
    </Popover>
  )
}

const SamplesParameter = ({
  form,
  name,
  initialValue,
}: {
  form: FormInstance
  name: string
  initialValue?: number
}) => {
  const onChangeHandler = (newVal: number) => {
    form.setFieldsValue({ ['n_samples']: Number(newVal) })
  }

  return (
    <div className="mt-2 flex">
      <ParameterAddon
        title={'Samples'}
        description={'Select the number of image variations to generate'}
      />
      <Form.Item
        name={name}
        className="mt-0 mb-0"
        dependencies={['n_samples']}
        initialValue={initialValue}
        rules={[
          () => ({
            // validator(rule, incomingValue) {
            validator() {
              return Promise.resolve()
            },
          }),
        ]}
      >
        <Select onChange={onChangeHandler} className="with-addon">
          <Select.Option key={1} value={1}>
            1
          </Select.Option>
          <Select.Option key={2} value={2}>
            2
          </Select.Option>
          <Select.Option key={4} value={4}>
            4
          </Select.Option>
        </Select>
      </Form.Item>
    </div>
  )
}

export default SamplesParameter
