import { GeneratorParameterV2 } from '@edenlabs/eden-sdk'

export type ParameterGroup = {
  type: 'dependencyGroup' | 'standalone'
  parameter?: GeneratorParameterV2
  toggle?: GeneratorParameterV2
  groupParameters?: GeneratorParameterV2[]
}

/**
 * Groups the given parameters based on their visibility conditions.
 *
 * @param {GeneratorParameterV2[]} parameters - The list of parameters to be grouped.
 *
 * @return {ParameterGroup[]} - The grouped parameters.
 */
export function groupParameters(parameters: GeneratorParameterV2[]) {
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
        const elementIndex = orderedElements.findIndex(
          val => val.toggle?.name === toggleName,
        )

        // hidden by default, displayed beneath toggle
        if (requiredValue === 'true') {
          orderedElements[elementIndex]?.groupParameters?.push(parameter)
        } else {
          orderedElements.push({
            type: 'standalone',
            parameter,
          })
        }
      }
    }
  })
  return orderedElements
}
