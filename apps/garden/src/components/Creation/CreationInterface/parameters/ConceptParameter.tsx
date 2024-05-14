import { trainingModeColorMap } from '@/components/Concept/ConceptCard/ConceptCard'
import LoadingIndicator from '@/components/LoadingIndicator'
import CreatorProfileLink from '@/components/Profile/CreatorProfileLink'
import { useConcept } from '@/hooks/useConcept'
import { GeneratorParameter } from '@edenlabs/eden-sdk'
import CloseIcon from '@mui/icons-material/Close'
import { App, Button, Form, FormInstance, Input, Tag } from 'antd'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import CdnImage from '@/components/Media/cdn-image'

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
                <CdnImage
                  width={48}
                  height={48}
                  src={concept?.thumbnail}
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

const ConceptParameter = (props: {
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
    // const queryParams = new URLSearchParams(window.location.search)
    const conceptParam =
      router.query && router.query.concept
        ? String(router.query.concept)
        : undefined // world
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

  const onChange = async (newValue: string | null) => {
    // hacky way to get rid of the query parameter - avoiding next.router here because it would trigger a rerender
    if (preselectedConceptId) {
      setPreselectedConceptId(null)
      const newUrl = '/create/creations'
      await router.push(newUrl, newUrl)
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
      {loraId ? (
        <>
          {concept ? (
            <ConceptParameterUI conceptId={concept._id} onChange={onChange} />
          ) : (
            <LoadingIndicator />
          )}
        </>
      ) : null}
    </div>
  )
}

export default ConceptParameter
