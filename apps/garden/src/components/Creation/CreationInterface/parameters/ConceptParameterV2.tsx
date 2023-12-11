import { trainingModeColorMap } from '@/components/Concept/ConceptCard/ConceptCard'
import LoadingIndicator from '@/components/LoadingIndicator'
import CreatorProfileLink from '@/components/Profile/CreatorProfileLink'
import { useConcept } from '@/hooks/useConcept'
import { CONFIG } from '@/lib/config'
import { Concept, GeneratorParameter } from '@edenlabs/eden-sdk'
import { Button } from '@mui/material'
import { Form, FormInstance, Input, Tag } from 'antd'
import Image from 'next/image'
import React, { useEffect, useState } from 'react'

export const ConceptParameterUI = ({
  concept,
  onChange,
}: {
  concept: Concept | undefined
  onChange: (newValue: string | null) => void
}) => {
  return (
    <div className="bg-gray-300 dark:bg-gray-800 rounded-md flex w-full h-16">
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
          <div className="w-full flex flex-col justify-around h-full py-0.5">
            <div className="flex gap-2">
              <div>{`${concept.conceptName}`}</div>
              <Tag
                color={
                  trainingModeColorMap[
                    concept?.task?.config?.mode ||
                      concept?.task?.config?.concept_mode
                  ]
                }
                className="first-letter:capitalize me-0"
              >
                {concept?.task?.config?.mode ||
                  concept?.task?.config?.concept_mode}
              </Tag>
            </div>
            <div className="flex gap-1 text-xs text-gray-700 dark:text-gray-500 items-center">
              <div>{concept.name}</div>
              <div className="text-gray-400">•</div>
              <div>{concept.checkpoint}</div>
            </div>
            <div className="flex gap-1">
              <span className="text-xs dark:text-gray-300">by</span>{' '}
              <CreatorProfileLink
                creatorId={concept.user.userId}
                creatorName={concept.user.username}
              />
            </div>
          </div>
          <Button
            size="small"
            variant="outlined"
            color="secondary"
            onClick={() => onChange(null)}
            className="!normal-case"
          >
            Remove
          </Button>
        </div>
      ) : (
        <LoadingIndicator />
      )}
    </div>
  )
}

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
        <ConceptParameterUI concept={concept} onChange={onChange} />
      ) : null}
    </div>
  )
}

export default ConceptParameterV2
