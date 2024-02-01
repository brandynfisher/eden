import SelectCharacterModalTrigger from '@/components/Creation/CreationInterface/SelectCharacterModalTrigger'
import { CharacterParameterUI } from '@/components/Creation/CreationInterface/parameters/CharacterParameter'
import LoadingIndicator from '@/components/LoadingIndicator'
import { useCharacter } from '@/hooks/useCharacter'
import { GeneratorParameter } from '@edenlabs/eden-sdk'
import { Badge, Form, FormInstance, Input } from 'antd'
import React, { useEffect, useState } from 'react'

const CharacterInput = ({
  characterId,
  index,
  onChange,
}: {
  characterId: string | null
  index: number
  onChange: (characterId: string, index: number) => void
}) => {
  const { character } = useCharacter(characterId)

  return (
    <>
      <Badge
        className="w-full pointer-events-none"
        count={index + 1}
        color={'#A4A4A4'}
      >
        <div className="pointer-events-auto">
          <SelectCharacterModalTrigger
            onChange={character => {
              onChange(character._id, index)
            }}
          />

          {characterId ? (
            <div className="mt-2 w-full">
              {character ? (
                <CharacterParameterUI
                  characterId={characterId}
                  onChange={val => onChange(val || '', index)}
                />
              ) : (
                <LoadingIndicator />
              )}
            </div>
          ) : null}
        </div>
      </Badge>
    </>
  )
}

const validateCharacterSelection = (
  characterIds: string[],
  minLength: number,
): Validation => {
  if (characterIds.filter(item => !!item).length < minLength) {
    return {
      validateStatus: 'error',
      errorMsg: `At least ${minLength} characters required`,
    }
  }

  return {
    validateStatus: 'success',
    errorMsg: null,
  }
}

type Validation = {
  validateStatus:
    | ''
    | 'error'
    | 'success'
    | 'warning'
    | 'validating'
    | undefined
  errorMsg: string | null
}

const CharactersParameter = (props: {
  form: FormInstance
  parameter: GeneratorParameter
}) => {
  const [values, setValues] = useState(
    new Array(props.parameter.minLength || 1).fill(''),
  )
  const characterIds = Form.useWatch('characterIds')
  const [validation, setValidation] = useState<Validation | null>(null)
  // const [preselectedCharacterIds, setPreselectedCharacterIds] = useState<
  //   string[] | null
  // >(null)

  // const { character } = useCharacter(characterId || preselectedCharacterId)

  // useEffect(() => {
  //   if (
  //     characters &&
  //     preselectedCharacterIds &&
  //     characterIds === preselectedCharacterIds
  //   ) {
  //     message.open({
  //       key: 'character-selected-toast',
  //       icon: false,
  //       content: (
  //         <div onClick={() => message.destroy('character-selected-toast')}>
  //           <div className="my-1 text-xs font-bold">Characters selected:</div>
  //           {characterIds.map((item:string) => (
  //             <CharacterParameterUI
  //               key={item}
  //               characterId={item}
  //               onChange={onChange}
  //             />
  //           ))}
  //         </div>
  //       ),
  //       duration: 3,
  //       className: 'character-notice',
  //     })
  //   }
  // }, [characters, preselectedCharacterIds])

  // useEffect(() => {
  //   const queryParams = new URLSearchParams(window.location.search)
  //   const charactersParam = queryParams.get('characters')// world
  //   if (charactersParam) {
  //     onChange(charactersParam)
  //     setPreselectedCharacterIds(charactersParam)
  //   } else {
  //     setPreselectedCharacterIds(null)
  //   }
  // }, [router.query])
  //
  // console.log({characterIds})
  useEffect(() => {
    if (characterIds) {
      setValues(characterIds)
    }
  }, [setValues, characterIds])

  const onSelectionChange = (values: string[]) => {
    setValidation(
      validateCharacterSelection(values, props.parameter.minLength || 0),
    )
  }

  useEffect(() => {
    // console.log({values})
    props.form.setFieldsValue({
      [props.parameter.name]:
        validation === null ||
        validation.validateStatus === 'error' ||
        values === null
          ? undefined
          : values,
    })
  }, [values, validation])

  const onChange = (newValue: string, index: number) => {
    // hacky way to get rid of the query parameter - avoiding next.router here because it would trigger a rerender
    // if (preselectedCharacterIds) {
    //   setPreselectedCharacterIds(null)
    //   const newUrl = '/create/creations'
    //   window.history.pushState(
    //     { ...window.history.state, as: newUrl, url: newUrl },
    //     '',
    //     newUrl,
    //   )
    // }

    setValues(prev => {
      const newValues = [...prev]
      newValues[index] = newValue
      onSelectionChange(newValues)
      // added
      if (newValue) {
        return [...newValues, '']
      }

      // removed
      return newValues.length > 1
        ? [...newValues.filter(val => val !== ''), '']
        : newValues
    })
  }

  // console.log(validation)

  return (
    <div>
      {JSON.stringify(values)}
      {values.map((value, index) => (
        <div
          key={`${index}_${value}`}
          className="flex flex-wrap items-center justify-between mb-2"
        >
          <CharacterInput
            characterId={value}
            index={index}
            onChange={onChange}
          />
        </div>
      ))}
      <Form.Item
        className={`mb-0 flex-grow custom-form-item`}
        name={props.parameter.name}
        rules={[
          {
            required:
              (props.parameter.isRequired &&
                props.parameter.minLength &&
                props.parameter.minLength > 0) ||
              false,
            type: 'array',
            message: `At least ${props.parameter.minLength} Characters required`,
          },
        ]}
        validateStatus={validation?.validateStatus}
        help={validation?.errorMsg}
      >
        <Input value={values} disabled={true} className="hidden" />
      </Form.Item>
    </div>
  )
}

export default CharactersParameter
