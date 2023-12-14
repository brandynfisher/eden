import ParameterAddon from '@/components/Creation/CreationInterface/parameters/ParameterAddon'
import { Form, FormInstance, Select } from 'antd'
import React from 'react'

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
        className="my-0"
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
