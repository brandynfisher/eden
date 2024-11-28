import LoadingIndicator from '@/components/loading-indicator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useAuthState } from '@/hooks/use-auth-state'
import { getCostConfig, useCostCalculation } from '@/hooks/use-cost-calculation'
import { cn } from '@/lib/utils'
import { ToolParameterV2 } from '@edenlabs/eden-sdk'
import { CoinsIcon } from 'lucide-react'
import React, { Suspense } from 'react'
import { useFormContext } from 'react-hook-form'

const regex = /\b[^\d\W]+(\.[^\d\W]+)*\b/g // match words that may contain periods: "(width/1024)/prompts.length * 2"

type CostValueProps = {
  formula?: string
  parameterNames: ToolParameterV2['name'][]
}

const CostValue: React.FC<CostValueProps> = ({ formula, parameterNames }) => {
  const { balance } = useAuthState()
  const { watch } = useFormContext()
  // watch all form fields listed in costEstimate expression
  const values = watch(parameterNames)
  const { calculateCost } = useCostCalculation()

  const cost = calculateCost(
    formula || '',
    getCostConfig({ parameterNames, parameterValues: values }),
  )

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
