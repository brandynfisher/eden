import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { GeneratorParameterV2 } from '@edenlabs/eden-sdk'
import { Parser } from 'expr-eval'
import { CoinsIcon } from 'lucide-react'
import { useWatch } from 'react-hook-form'

const regex = /\b[^\d\W]+\b/g //match words, not numbers

const calculateCost = (
  formula: string,
  fieldNames: string[],
  values: number[],
) => {
  const nameValueMap: Record<GeneratorParameterV2['name'], number> =
    fieldNames.reduce<Record<GeneratorParameterV2['name'], number>>(
      (object, key, index) => {
        object[key as GeneratorParameterV2['name']] = values[index]
        return object
      },
      {},
    )

  return Parser.evaluate(formula, nameValueMap)
}

type CostValueProps = {
  formula?: string
  parameterNames: GeneratorParameterV2['name'][]
}

const CostValue = ({ formula, parameterNames }: CostValueProps) => {
  // console.log('re-rendering costValue', formula, !!formula)
  const watchedValues: number[] = useWatch({
    name: parameterNames,
    disabled: !parameterNames.length,
  })
  const cost = formula
    ? calculateCost(formula, parameterNames, watchedValues)
    : 1
  // console.log({ formula, parameterNames, watchedValues, cost })

  return formula ? (
    <div className="flex items-center justify-center text-sm">
      <CoinsIcon className="mr-1.5 h-4 w-4" />
      <span className="font-mono">{Math.floor(cost) || 1}</span>
    </div>
  ) : (
    <div>n/a</div>
  )
}

type Props = {
  formula?: string
}

const CostIndicatorV2 = ({ formula }: Props) => {
  const matches = formula?.match(regex) || []
  const costParameterNames = matches.map(match => match.trim())

  return (
    <TooltipProvider delayDuration={125}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-pointer flex items-center justify-center border border-muted rounded-md py-2 px-2 bg-accent">
            <CostValue formula={formula} parameterNames={costParameterNames} />
          </div>
        </TooltipTrigger>
        <TooltipContent>
          Estimated Manna cost for this configuration
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export default CostIndicatorV2
