import { ToolParameterV2 } from '@edenlabs/eden-sdk'
import { Parser } from 'expr-eval'

const regex = /\b[^\d\W]+(\.[^\d\W]+)*\b/g // match words that may contain periods: "(width/1024)/prompts.length * 2"

// Helper to determine if a string is a direct value comparison
const isDirectComparison = (formula: string, paramName: string): boolean => {
  const comparisonRegex = new RegExp(`${paramName}\\s*[=!]=\\s*(['"].*?['"])`)
  return comparisonRegex.test(formula)
}

type ParameterValue =
  | string
  | number
  | string[]
  | number[]
  | string[][]
  | undefined

// Helper to get parameter value or length based on context
const getParameterValue = (
  value: ParameterValue,
  paramName: string,
  formula: string,
): string | number => {
  // Handle undefined/null case
  if (value === undefined || value === null) {
    return ''
  }

  // If it's a direct comparison (e.g., prompt == 'something'), return the raw value
  if (isDirectComparison(formula, paramName)) {
    return Array.isArray(value) ? value[0]?.toString() || '' : value.toString()
  }

  // For arrays and strings, return length
  if (Array.isArray(value)) {
    return value.length
  }

  // For strings without direct comparison, return length
  if (typeof value === 'string') {
    return value.length
  }

  // For numbers, return as is
  if (typeof value === 'number') {
    return value
  }

  return 0
}

export const getCostConfig = ({
  parameterNames,
  parameterValues,
  formula,
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
  formula: string
}) => {
  return parameterNames.reduce((acc, key, i) => {
    const value = parameterValues[i]
    const resolvedValue = getParameterValue(value, key, formula)

    acc[key] = resolvedValue
    // Still maintain _length for backward compatibility
    acc[`${key}_length`] =
      typeof resolvedValue === 'string' ? resolvedValue.length : resolvedValue

    return acc
  }, {} as Record<string, number | string>)
}

export const calculateCost = (
  formula: string,
  formValues: Record<string, string[] | number[] | string[][] | string>,
) => {
  // Replace .length with _length in the formula to maintain backward compatibility
  const adjustedFormula = formula.replace(/\.length/g, '_length')

  // Extract all parameter names from the formula
  const matches = adjustedFormula.match(regex) || []
  const costParameterNames = [
    ...new Set(matches.map(m => m.replace('_length', ''))),
  ]

  const parameterValues = costParameterNames.map(name => formValues[name])

  const costConfig = getCostConfig({
    parameterNames: costParameterNames,
    parameterValues,
    formula: adjustedFormula,
  })

  try {
    // Convert strings to numbers for evaluation unless they're used in direct comparisons
    const numericConfig = Object.entries(costConfig).reduce(
      (acc, [key, value]) => {
        // Keep string values as-is if they're used in direct comparisons
        if (
          typeof value === 'string' &&
          isDirectComparison(adjustedFormula, key)
        ) {
          acc[key] = value
        } else {
          // Convert to number otherwise
          acc[key] = typeof value === 'string' ? value.length : value
        }
        return acc
      },
      {} as Record<string, number | string>,
    )

    return Parser.evaluate(adjustedFormula, numericConfig)
  } catch (e) {
    console.error('Could not parse cost_estimate', e)
    return Infinity
  }
}
