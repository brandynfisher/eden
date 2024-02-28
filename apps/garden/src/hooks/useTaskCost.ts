import { UserContext } from '@/providers/UserProvider'
import { Task } from '@edenlabs/eden-sdk'
import { useCallback, useContext, useEffect, useState } from 'react'

const baseCostPerVideoFrame = 0.75

const costFactorParameterNames = ['n_samples', 'n_frames']

const staticCostGenerators = [
  {
    generatorName: 'sdxl-lora-trainer',
    cost: 75,
  },
  {
    generatorName: 'dialogue',
    cost: 30,
  },
  {
    generatorName: 'monologue',
    cost: 30,
  },
  {
    generatorName: 'story',
    cost: 30,
  },
  {
    generatorName: 'reel',
    cost: 30,
  },
]

export const useTaskCost = () => {
  const [taskCost, setTaskCost] = useState<number | undefined>()
  const [canAffordOperation, setCanAffordOperation] = useState<
    boolean | undefined
  >(undefined)
  const { mannaBalance } = useContext(UserContext)

  useEffect(() => {
    if (taskCost && mannaBalance) {
      setCanAffordOperation(mannaBalance >= taskCost)
    }
  }, [taskCost, mannaBalance])

  const getTaskCostFake = useCallback(
    (generatorName: string, config: Task['config']) => {
      // console.log(generatorName, config)

      const staticGenerator = staticCostGenerators.filter(
        gen => gen.generatorName === generatorName,
      )
      if (staticGenerator.length > 0) {
        setTaskCost(staticGenerator[0].cost)
        return {
          cost: staticCostGenerators[0].cost,
          canAfford: (mannaBalance || 0) >= staticCostGenerators[0].cost,
        }
      }

      const configParamArray: [string, number][] = Object.entries(config)
      const costFactorParams: [string, number][] = configParamArray.filter(
        configParam => costFactorParameterNames.includes(configParam[0]),
      )

      if (costFactorParams.length > 0) {
        const totalFactor = costFactorParams
          .map(factor => {
            if (factor[0] === 'n_frames') {
              return Math.round(factor[1] * baseCostPerVideoFrame) || 1
            }
            return factor[1]
          })
          .reduce((total, arr) => total + arr)
        setTaskCost(totalFactor)
        return {
          cost: totalFactor,
          canAfford: (mannaBalance || 0) >= totalFactor,
        }
      }

      setTaskCost(1)
      return {
        cost: 1,
        canAfford: (mannaBalance || 0) >= 1,
      }
    },
    [mannaBalance],
  )

  return {
    getTaskCost: getTaskCostFake,
    taskCost,
    canAffordOperation,
  }
}
