import { ToolParameterV2 } from '@edenlabs/eden-sdk'
import { Parser } from 'expr-eval'

const regex = /\b[^\d\W]+(\.[^\d\W]+)*\b/g // match words that may contain periods: "(width/1024)/prompts.length * 2"

export const getCostConfig = ({
  parameterNames,
  parameterValues,
}: {
  parameterNames: ToolParameterV2['name'][]
  parameterValues: (
    | number
    | string[]
    | number[]
    | string[][]
    | string
    | undefined
  )[]
}) => {
  return parameterNames.reduce((acc, key, i) => {
    const value = parameterValues[i]
    if (Array.isArray(value)) {
      acc[`${key}_length`] = value.length || 0
      // Don't store array values directly since they can't be used in formula
    } else if (typeof value === 'string') {
      acc[`${key}_length`] = value.length
      acc[key] = value
    } else if (typeof value === 'number') {
      acc[key] = value
    } else {
      // Handle undefined/null case
      acc[`${key}_length`] = 0
      acc[key] = ''
    }
    return acc
  }, {} as Record<string, number | string>)
}

export const calculateCost = (
  formula: string,
  formValues: Record<string, string[] | number[] | string[][] | string>,
) => {
  // Replace .length with _length in the formula to match our config format
  const adjustedFormula = formula.replace(/\.length/g, '_length')

  // Extract all parameter names from the formula, including those with _length
  const matches = adjustedFormula.match(regex) || []
  const costParameterNames = [
    ...new Set(matches.map(m => m.replace('_length', ''))),
  ]

  const parameterValues = costParameterNames.map(name => formValues[name])

  const costConfig = getCostConfig({
    parameterNames: costParameterNames,
    parameterValues,
  })

  try {
    // Convert strings to numbers for evaluation
    const numericConfig = Object.entries(costConfig).reduce(
      (acc, [key, value]) => {
        acc[key] = typeof value === 'string' ? value.length : value
        return acc
      },
      {} as Record<string, number>,
    )

    return Parser.evaluate(adjustedFormula, numericConfig)
  } catch (e) {
    console.error('Could not parse cost_estimate', e)
    return Infinity
  }
}
