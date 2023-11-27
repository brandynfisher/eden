import LoadingIndicator from '@/components/LoadingIndicator'
import { useConcept } from '@/hooks/useConcept'
import { CONFIG } from '@/lib/config'
import { GeneratorParameter } from '@edenlabs/eden-sdk'
import { Button } from '@mui/material'
import { Form, FormInstance, Input } from 'antd'
import Image from 'next/image'
import { useEffect, useState } from 'react'

const ConceptParameterV2 = (props: {
  form: FormInstance
  parameter: GeneratorParameter
}) => {
  const [value, setValue] = useState(props.parameter.default)
  const loraId = Form.useWatch('lora')
  const { concept } = useConcept(loraId)

  useEffect(() => {
    setValue(loraId)
  }, [setValue, loraId])

  const onChange = (newValue: string | null) => {
    setValue(newValue)
    props.form.setFieldsValue({
      [props.parameter.name]: newValue === null ? undefined : newValue,
    })
  }

  const handleRemoveConcept = () => {
    onChange(null)
  }

  return (
    <div
      className={`flex gap-2 flex-wrap items-center justify-between ${
        !loraId ? 'hidden' : ''
      }`}
    >
      <Form.Item
        className={`mb-0 flex-grow hidden`}
        name={props.parameter.name}
        initialValue={props.parameter.default}
        rules={[
          {
            required: props.parameter.isRequired,
            message: `${props.parameter.label} required`,
          },
        ]}
      >
        <Input value={value} disabled={true} />
      </Form.Item>
      {loraId ? (
        <div className="bg-gray-800 rounded-md flex w-full h-16">
          {concept ? (
            <div className="pr-2 flex gap-4 items-center w-full">
              {concept.thumbnail ? (
                <Image
                  width={64}
                  height={64}
                  src={
                    concept.thumbnail ||
                    `${CONFIG.NEXT_PUBLIC_HOST}/placeholder.png`
                  }
                  alt={`${concept.conceptName} - ${concept.checkpoint}`}
                  className="rounded"
                />
              ) : null}
              <div className="w-full">
                <div>{`${concept.conceptName} - ${concept.checkpoint}`}</div>
                <div className="text-xs text-gray-500">
                  {concept.conceptName}
                </div>
              </div>
              <Button
                size="small"
                variant="outlined"
                color="secondary"
                onClick={handleRemoveConcept}
                className="!normal-case"
              >
                Remove
              </Button>
            </div>
          ) : (
            <LoadingIndicator />
          )}
        </div>
      ) : null}
    </div>
  )
}

export default ConceptParameterV2
