import { getCostConfig, useCostCalculation } from '@/hooks/use-cost-calculation'
import { ToolParameterV2 } from '@edenlabs/eden-sdk'
import { describe, expect, it } from '@jest/globals'

describe('hooks/use-cost-calculation', () => {
  describe('getCostConfig', () => {
    it('should return correct name-value object for non-array parameters', () => {
      const parameterNames: ToolParameterV2['name'][] = ['param1', 'param2']
      const parameterValues = [10, 20]
      const result = getCostConfig({ parameterNames, parameterValues })
      expect(result).toEqual({ param1: 10, param2: 20 })
    })

    it('should handle array parameters and calculate their lengths', () => {
      const parameterNames: ToolParameterV2['name'][] = ['param1', 'param2']
      const parameterValues = [['a', 'b', 'c']]
      const result = getCostConfig({ parameterNames, parameterValues })
      expect(result).toEqual({ param1_length: 3, param2_length: 0 })
    })
  })

  describe('calculateCost', () => {
    const { calculateCost } = useCostCalculation()

    it('should calculate cost based on given formula and config', () => {
      const formula = 'param1 + param2'
      const config = { param1: 10, param2: 15 }
      const result = calculateCost(formula, config)
      expect(result).toBe(25)
    })

    it('should return Infinity for incorrect formula', () => {
      const formula = 'param1 + param2'
      const config = { param1: 10 }
      const result = calculateCost(formula, config)
      expect(result).toBe(Infinity)
    })
  })
})
