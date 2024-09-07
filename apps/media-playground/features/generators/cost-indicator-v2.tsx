import { GeneratorParameterV2 } from '@edenlabs/eden-sdk'
import { Parser } from 'expr-eval'
import { CoinsIcon } from 'lucide-react'
import { useWatch } from 'react-hook-form'

type Props = {
  formula?: string
}

const regex = /{([^}]+)}/g //match anything within curly braces

const calculateCost = (
  evalParser: Parser,
  formula: string,
  fieldNames: string[],
  values: number[],
) => {
  console.log({ fieldNames, values })

  const nameValueMap: Record<GeneratorParameterV2['name'], number> =
    fieldNames.reduce<Record<GeneratorParameterV2['name'], number>>(
      (object, key, index) => {
        object[key as GeneratorParameterV2['name']] = values[index]
        return object
      },
      {},
    )

  console.log({ formula, nameValueMap })

  let expr = evalParser.parse(formula)

  return expr.evaluate(nameValueMap)
}

type CostValueProps = {
  evalParser: Parser
  formula?: string
  parameterNames: GeneratorParameterV2['name'][]
}

const CostValue = ({ evalParser, formula, parameterNames }: CostValueProps) => {
  console.log('re-rendering costValue', formula, !!formula)
  const watchedValues: number[] = useWatch({
    name: parameterNames,
    disabled: !parameterNames.length,
  })
  const cost = formula
    ? calculateCost(evalParser, formula, parameterNames, watchedValues)
    : 1
  console.log({ formula, parameterNames, watchedValues, cost })

  return formula ? (
    <div className="flex items-center justify-center text-sm">
      <CoinsIcon className="mr-2 h-4 w-4" />
      <span>{Math.floor(cost) || 1}</span>
    </div>
  ) : (
    <div>n/a</div>
  )
}

const CostIndicatorV2 = ({ formula }: Props) => {
  const cleanedFormula = formula?.replace(/{/g, ' ').replace(/}/g, ' ')
  const matches = formula?.match(regex) || []
  const costParameterNames = matches.map(match =>
    match.slice(1, match.length - 1),
  )
  const evalParser = new Parser()

  return (
    <div className="flex items-center justify-center border border-muted rounded-md py-2 px-2">
      <CostValue
        evalParser={evalParser}
        formula={cleanedFormula}
        parameterNames={costParameterNames}
      />
    </div>
  )
}

export default CostIndicatorV2
