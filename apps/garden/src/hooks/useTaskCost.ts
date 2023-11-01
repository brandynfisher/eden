import { UserContext } from '@/providers/UserProvider'
import { Task } from '@edenlabs/eden-sdk'
import { useCallback, useContext, useEffect, useState } from 'react'

const costFactorParameterNames = ['n_samples', 'n_frames']

const staticCostGenerators = [
  {
    generatorName: 'sdxl-lora-trainer',
    cost: 100,
  },
  {
    generatorName: 'dialogue',
    cost: 50,
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
        return
      }

      const configParamArray: [string, number][] = Object.entries(config)
      const costFactorParams: [string, number][] = configParamArray.filter(
        configParam => costFactorParameterNames.includes(configParam[0]),
      )

      if (costFactorParams.length > 0) {
        const totalFactor = costFactorParams
          .map(factor => factor[1])
          .reduce((total, arr) => total + arr)
        // console.log(generatorName, totalFactor)
        setTaskCost(totalFactor)
        return
      }

      setTaskCost(1)
    },
    [],
  )

  return {
    getTaskCost: getTaskCostFake,
    taskCost,
    canAffordOperation,
  }
}
