import { useConcepts } from '@/hooks/useConcepts'
import { UserContext } from '@/providers/UserProvider'
import { GeneratorParameter } from '@edenlabs/eden-sdk'
import { Form, FormInstance, Row, Select, Switch } from 'antd'
import { useContext, useState } from 'react'

const ConceptParameter = (props: {
  form: FormInstance
  parameter: GeneratorParameter
}) => {
  const [viewPublic, setViewPublic] = useState(false)
  const [value, setValue] = useState(props.parameter.default)
  const { user } = useContext(UserContext)
  const conceptFilter = !viewPublic && user ? user.userId : null
  const { concepts } = useConcepts(conceptFilter)

  const options = [
    { label: '', value: null },
    ...(concepts
      ? concepts.map(concept => ({
          label: concept.publicName,
          value: concept._id,
        }))
      : []),
  ]

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
        style={{ marginBottom: 5 }}
        label={props.parameter.label}
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
            style={{ maxWidth: '95%' }}
            options={options}
            onChange={onChange}
            className="flex ml-auto"
          />
        )}
      </Form.Item>
      <Row>
        <Switch checked={viewPublic} onChange={setViewPublic} />
        &nbsp;&nbsp;Search Public Concepts
      </Row>
      <Row>
        <span style={{ color: 'gray' }}>{props.parameter.description}</span>
      </Row>
    </>
  )
}

export default ConceptParameter
