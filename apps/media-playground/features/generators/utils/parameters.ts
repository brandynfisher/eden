import { GeneratorParameterV2 } from '@edenlabs/eden-sdk'

export type ParameterGroup = {
  type: 'dependencyGroup' | 'standalone'
  parameter?: GeneratorParameterV2
  toggle?: GeneratorParameterV2
  groupParameters?: GeneratorParameterV2[]
}

/**
 * Groups the given parameters with their toggle based on their visibility conditions.
 */
export function groupParameters(
  parameters: GeneratorParameterV2[],
): ParameterGroup[] {
  const orderedElements: ParameterGroup[] = []
  parameters.forEach(parameter => {
    const isToggle =
      parameter.name.startsWith('use_') && parameter.type === 'bool'

    if (isToggle) {
      orderedElements.push({
        type: 'dependencyGroup',
        toggle: parameter,
        groupParameters: [],
      })
    } else {
      if (!parameter.visible_if) {
        orderedElements.push({
          type: 'standalone',
          parameter,
        })
      } else {
        const [toggleName, requiredValue] = parameter.visible_if.split('=')
        const toggleElementIndex = orderedElements.findIndex(
          val => val.toggle?.name === toggleName,
        )

        // hidden by default, displayed beneath toggle
        if (requiredValue === 'true') {
          orderedElements[toggleElementIndex]?.groupParameters?.push(parameter)
        } else {
          orderedElements.push({
            type: 'standalone',
            toggle:
              toggleElementIndex !== -1
                ? orderedElements[toggleElementIndex].parameter
                : undefined,
            parameter,
          })
        }
      }
    }
  })
  return orderedElements
}

export function getCostRelevantParameters(parameters?: GeneratorParameterV2[]) {
  if (!parameters || !parameters.length) return []

  const dummyList: GeneratorParameterV2['name'][] = [
    'width',
    'height',
    'n_frames',
  ]
  const costParams = parameters.filter(param => dummyList.includes(param.name))
  console.log('getCostRelevantParameters', { dummyList, costParams })

  return costParams
}
