import LoadingIndicator from '@/components/LoadingIndicator'
import CreatorProfileLink from '@/components/Profile/CreatorProfileLink'
import { useCharacter } from '@/hooks/useCharacter'
import { MODAL_TYPES, useModalContext } from '@/providers/ModalProvider'
import { Character, GeneratorParameter } from '@edenlabs/eden-sdk'
import { Edit } from '@mui/icons-material'
import CloseIcon from '@mui/icons-material/Close'
import { App, Button, Form, FormInstance, Input } from 'antd'
import { useRouter } from 'next/router'
import React, { useEffect, useState } from 'react'
import CdnImage from '@/components/Media/cdn-image'

export const CharacterParameterUI = ({
  characterId,
  onChange,
  onEdit,
}: {
  characterId: string
  onChange: (newValue: string | null) => void
  onEdit?: (newValue: Character) => void
}) => {
  const { character, isLoading } = useCharacter(characterId)

  const { showModal, hideModal } = useModalContext()

  const handleChange = (item: Character) => {
    if (onEdit) {
      onEdit(item)
    }
    hideModal(null, MODAL_TYPES.CHARACTER_SELECT_MODAL)
  }

  const handleClickOpen = () => {
    showModal(MODAL_TYPES.CHARACTER_SELECT_MODAL, {
      onChange: handleChange,
    })
  }

  return (
    <div className="bg-gray-300 dark:bg-gray-800 rounded-md flex w-full h-12">
      {!character || isLoading ? (
        <LoadingIndicator />
      ) : (
        <>
          {character ? (
            <div className="pl-0 pr-1 py-1 flex gap-1 items-center w-full">
              {character.image ? (
                <CdnImage
                  width={48}
                  height={48}
                  src={character.image}
                  alt={`${character.name}`}
                  className="rounded object-contain max-h-full"
                />
              ) : null}
              <div className="w-full flex flex-col justify-around h-full py-0.5 flex-grow-0 flex-shrink max-w-[164px]">
                <div className="flex justify-between gap-4">
                  <div className="max-w-full whitespace-nowrap text-ellipsis overflow-hidden">{`${character.name}`}</div>
                </div>
                <div className="flex gap-1">
                  <span className="text-xs dark:text-gray-300">by</span>{' '}
                  <CreatorProfileLink
                    creatorId={character.user.userId}
                    creatorName={character.user.username}
                  />
                </div>
              </div>
              <Button
                className="w-[40px] h-[40px] flex items-center justify-center flex-shrink-0 ml-auto mr-0"
                onClick={handleClickOpen}
              >
                <Edit fontSize="medium" />
              </Button>
              <Button
                className="w-[40px] h-[40px] flex items-center justify-center flex-shrink-0"
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

const CharacterParameter = (props: {
  form: FormInstance
  parameter: GeneratorParameter
}) => {
  const router = useRouter()
  const { message } = App.useApp()
  const [value, setValue] = useState(props.parameter.default)
  const characterId = Form.useWatch('characterId')
  const [preselectedCharacterId, setPreselectedCharacterId] = useState<
    string | null
  >(null)
  const { character } = useCharacter(characterId || preselectedCharacterId)

  useEffect(() => {
    if (
      character &&
      preselectedCharacterId &&
      character._id === preselectedCharacterId
    ) {
      message.open({
        key: 'character-selected-toast',
        icon: false,
        content: (
          <div onClick={() => message.destroy('character-selected-toast')}>
            <div className="my-1 text-xs font-bold">Character selected:</div>
            <CharacterParameterUI
              characterId={character._id}
              onChange={onChange}
            />
          </div>
        ),
        duration: 3,
        className: 'character-notice',
      })
    }
  }, [character, preselectedCharacterId])

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search)
    const characterParam = queryParams.get('character') // world
    if (characterParam) {
      onChange(String(characterParam))
      setPreselectedCharacterId(characterParam)
    } else {
      setPreselectedCharacterId(null)
    }
  }, [router.query])

  useEffect(() => {
    if (characterId) {
      setValue(characterId)
    }
  }, [setValue, characterId])

  const onChange = (newValue: string | null) => {
    // hacky way to get rid of the query parameter - avoiding next.router here because it would trigger a rerender
    if (preselectedCharacterId) {
      setPreselectedCharacterId(null)
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
    <div className={`flex flex-wrap items-center justify-between`}>
      <Form.Item
        className={`mb-0 flex-grow custom-form-item`}
        name={props.parameter.name}
        initialValue={props.parameter.default}
        rules={[
          {
            required: props.parameter.isRequired,
            message: `${props.parameter.label} required`,
          },
        ]}
      >
        <Input value={value} disabled={true} className="hidden" />
      </Form.Item>
      {characterId ? (
        <div className="mt-2 w-full">
          {character ? (
            <CharacterParameterUI
              characterId={character._id}
              onChange={onChange}
            />
          ) : (
            <LoadingIndicator />
          )}
        </div>
      ) : null}
    </div>
  )
}

export default CharacterParameter
