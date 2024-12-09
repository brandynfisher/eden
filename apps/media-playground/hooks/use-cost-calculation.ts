import { ToolParameterV2 } from '@edenlabs/eden-sdk'
import { Parser } from 'expr-eval'

export const getCostConfig = ({
  parameterNames,
  parameterValues,
}: {
  parameterNames: ToolParameterV2['name'][]
  parameterValues: string[] | number[] | string[][]
}) => {
  const nameValueMap: Map<string, number> = parameterNames.reduce(
    (acc, key, i) => {
      const isArrayField =
        typeof parameterValues[i] === 'undefined' ||
        Array.isArray(parameterValues[i])
      if (isArrayField) {
        acc.set(
          `${key}_length`,
          Array.isArray(parameterValues[i])
            ? (parameterValues[i] as string).length
            : 0,
        )
      } else {
        acc.set(key, parameterValues[i] as number)
      }
      return acc
    },
    new Map<string, number>(),
  )

  const nameValueObject = Object.fromEntries(nameValueMap.entries())

  // console.log(nameValueMap, nameValueObject)
  return nameValueObject
}

const calculateCost = (
  formula: string,
  config: { [key: string]: string | number },
): number => {
  // console.log({config})
  try {
    return Parser.evaluate(formula, config)
  } catch (e) {
    // console.error('Could not parse cost_estimate', e)
    return Infinity
  }
}

export const useCostCalculation = () => {
  return {
    calculateCost: (
      formula: string,
      config: { [key: string]: string | number },
    ) => calculateCost((formula || '').replace(/\.length/g, '_length'), config),
  }
}
