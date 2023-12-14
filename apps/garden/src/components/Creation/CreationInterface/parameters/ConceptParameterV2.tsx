import { trainingModeColorMap } from '@/components/Concept/ConceptCard/ConceptCard'
import LoadingIndicator from '@/components/LoadingIndicator'
import CreatorProfileLink from '@/components/Profile/CreatorProfileLink'
import { useConcept } from '@/hooks/useConcept'
import { CONFIG } from '@/lib/config'
import { GeneratorParameter } from '@edenlabs/eden-sdk'
import CloseIcon from '@mui/icons-material/Close'
import { App, Button, Form, FormInstance, Input, Tag } from 'antd'
import Image from 'next/image'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'

export const ConceptParameterUI = ({
  conceptId,
  onChange,
}: {
  conceptId: string
  onChange: (newValue: string | null) => void
}) => {
  const { concept, isLoading } = useConcept(conceptId)

  return (
    <div className="bg-gray-300 dark:bg-gray-800 rounded-md flex w-full h-12">
      {!concept || isLoading ? (
        <LoadingIndicator />
      ) : (
        <>
          {concept ? (
            <div className="pr-1 flex gap-2 items-center w-full">
              {concept.thumbnail ? (
                <Image
                  width={48}
                  height={48}
                  src={
                    concept.thumbnail ||
                    `${CONFIG.NEXT_PUBLIC_HOST}/placeholder.png`
                  }
                  alt={`${concept.conceptName} - ${concept.checkpoint}`}
                  className="rounded"
                />
              ) : null}
              <div className="w-full flex flex-col justify-around h-full py-0.5 flex-grow-0 flex-shrink max-w-[220px]">
                <div className="flex justify-between gap-4">
                  <div className="max-w-full whitespace-nowrap text-ellipsis overflow-hidden">{`${concept.conceptName}`}</div>
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
                {/*<div className="flex gap-1 text-xs text-gray-700 dark:text-gray-500 items-center">*/}
                {/*  <div className="max-w-full whitespace-nowrap text-ellipsis overflow-hidden">*/}
                {/*    {concept.name}*/}
                {/*  </div>*/}
                {/*  /!*<div className="text-gray-400">•</div>*!/*/}
                {/*  /!*<div>{concept.checkpoint}</div>*!/*/}
                {/*</div>*/}
                <div className="flex gap-1">
                  <span className="text-xs dark:text-gray-300">by</span>{' '}
                  <CreatorProfileLink
                    creatorId={concept.user.userId}
                    creatorName={concept.user.username}
                  />
                </div>
              </div>
              <Button
                className="w-[40px] h-[40px] flex items-center justify-center flex-shrink-0 ml-auto"
                onClick={() => onChange(null)}
              >
                <CloseIcon className="text-red-500" />
              </Button>
            </div>
          ) : null}
        </>
      )}
    </div>
  )
}

const ConceptParameterV2 = (props: {
  form: FormInstance
  parameter: GeneratorParameter
}) => {
  const router = useRouter()
  const { message } = App.useApp()
  const [value, setValue] = useState(props.parameter.default)
  const loraId = Form.useWatch('lora')
  const [preselectedConceptId, setPreselectedConceptId] = useState<
    string | null
  >(null)
  const { concept } = useConcept(loraId || preselectedConceptId)

  useEffect(() => {
    if (
      concept &&
      preselectedConceptId &&
      concept._id === preselectedConceptId
    ) {
      message.open({
        key: 'concept-selected-toast',
        icon: false,
        content: (
          <div onClick={() => message.destroy('concept-selected-toast')}>
            <div className="my-1 text-xs font-bold">Concept selected:</div>
            <ConceptParameterUI conceptId={concept._id} onChange={onChange} />
          </div>
        ),
        duration: 3,
        className: 'concept-notice',
      })
    }
  }, [concept, preselectedConceptId])

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search)
    const conceptParam = queryParams.get('concept') // world
    if (conceptParam) {
      onChange(String(conceptParam))
      setPreselectedConceptId(conceptParam)
    } else {
      setPreselectedConceptId(null)
    }
  }, [router.query])

  useEffect(() => {
    if (loraId) {
      setValue(loraId)
    }
  }, [setValue, loraId])

  const onChange = (newValue: string | null) => {
    if (newValue === null && preselectedConceptId) {
      const newUrl = '/create/creations'
      window.history.pushState(
        { ...window.history.state, as: newUrl, url: newUrl },
        '',
        newUrl,
      )
    }

    setValue(newValue)
    props.form.setFieldsValue({
      [props.parameter.name]: newValue === null ? undefined : newValue,
    })
  }

  return (
    <div
      className={`flex flex-wrap items-center justify-between ${
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
      {loraId && concept ? (
        <ConceptParameterUI conceptId={concept._id} onChange={onChange} />
      ) : null}
    </div>
  )
}

export default ConceptParameterV2
