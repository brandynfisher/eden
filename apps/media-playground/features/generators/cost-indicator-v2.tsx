import LoadingIndicator from '@/components/loading-indicator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAuthState } from '@/hooks/use-auth-state'
import { cn } from '@/lib/utils'
import { GeneratorParameterV2 } from '@edenlabs/eden-sdk'
import { Parser } from 'expr-eval'
import { CoinsIcon } from 'lucide-react'
import React, { Suspense } from 'react'
import { useFormContext } from 'react-hook-form'

const regex = /\b[^\d\W]+(\.[^\d\W]+)*\b/g // match words that may contain periods: "(width/1024)/prompts.length * 2"

const calculateCost = (
  formula: string,
  parameterNames: GeneratorParameterV2['name'][],
  values: string[] | number[],
) => {
  const nameValueMap: Map<string, number> = parameterNames.reduce(
    (acc, key, i) => {
      const isArrayField =
        typeof values[i] === 'undefined' || Array.isArray(values[i])
      if (isArrayField) {
        acc.set(
          `${key}_length`,
          Array.isArray(values[i]) ? (values[i] as string).length : 0,
        )
      } else {
        acc.set(key, values[i] as number)
      }
      return acc
    },
    new Map<string, number>(),
  )

  const nameValueObject = Object.fromEntries(nameValueMap.entries())

  return Parser.evaluate(formula, nameValueObject)
}

type CostValueProps = {
  formula?: string
  parameterNames: GeneratorParameterV2['name'][]
}

const CostValue: React.FC<CostValueProps> = ({ formula, parameterNames }) => {
  const { balance } = useAuthState()
  const { watch } = useFormContext()
  const values = watch(parameterNames)
  let cost = 1

  if (formula) {
    cost = calculateCost(
      formula.replace(/\.length/g, '_length'),
      parameterNames,
      values,
    )
  }

  return (
    <div
      className={cn([
        'flex items-center justify-center text-xs',
        balance < cost ? 'text-destructive' : '',
      ])}
    >
      <CoinsIcon className="mr-1.5 h-4 w-4" />
      <span className="font-mono">{Math.floor(cost) || 1}</span>
    </div>
  )
}

type Props = {
  formula?: string
}

const CostIndicatorV2: React.FC<Props> = ({ formula }) => {
  const costParameterNames = formula
    ? Array.from(
        new Set(
          (formula.match(regex) || []).map(
            match => match.replace('.length', ''), // if expression field ends with .length, we're interested in num array elements of the given field
          ),
        ),
      )
    : []

  return (
    <TooltipProvider delayDuration={125}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="cursor-pointer flex items-center justify-center">
            <Suspense fallback={<LoadingIndicator />}>
              <CostValue
                formula={formula}
                parameterNames={costParameterNames}
              />
            </Suspense>
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
