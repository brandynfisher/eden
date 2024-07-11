import { GeneratorParameterV2 } from '@edenlabs/eden-sdk'
import {
  ZodDefault,
  ZodNumber,
  ZodOptional,
  ZodString,
  ZodTypeAny,
  z,
} from 'zod'

function defaultHelper<T extends ZodTypeAny>(
  schema: T,
  defaultValue: string | number | null,
): (T & ZodDefault<T>) | T {
  if (defaultValue !== null) {
    return schema.default(defaultValue) as T & ZodDefault<T>
  }
  return schema
}

function optionalHelper<T extends ZodTypeAny>(
  schema: T,
  isOptional: boolean,
): (T & ZodOptional<T>) | T {
  if (isOptional) {
    return schema.optional() as T & ZodOptional<T>
  }
  return schema
}

function createNumberSchema(
  parameter: GeneratorParameterV2,
): ZodNumber | ZodOptional<ZodNumber> | ZodDefault<ZodNumber> {
  let schema: ZodNumber = z.number()

  if (parameter.minimum !== null) {
    schema = schema.min(parameter.minimum)
  }
  if (parameter.maximum !== null) {
    schema = schema.max(parameter.maximum)
  }

  // console.log(parameter.default, parameter.default === 'random' ? null : parameter.default)
  schema = defaultHelper(
    schema,
    parameter.default === 'random' ? null : parameter.default,
  )
  schema = optionalHelper(schema, !parameter.required)

  if (parameter.type === 'int' || parameter.type === 'int[]') {
    schema = schema.refine(
      Number.isInteger,
      'Must be an integer',
    ) as unknown as ZodNumber
  }

  return schema
}

function createStringSchema(
  parameter: GeneratorParameterV2,
): ZodString | ZodOptional<ZodString> | ZodDefault<ZodString> {
  let schema: ZodString = z.string()

  if (parameter.min_length !== null) {
    schema = schema.min(
      parameter.min_length,
      `Must be at least ${parameter.min_length} characters long`,
    )
  }

  if (parameter.max_length !== null) {
    schema = schema.max(
      parameter.max_length,
      `Must be less than ${parameter.max_length} characters long`,
    )
  }

  schema = defaultHelper(schema, parameter.default)
  schema = optionalHelper(schema, !parameter.required)

  return schema
}

export function createZodParameterSchema(
  parameter: GeneratorParameterV2,
): ZodTypeAny {
  switch (parameter.type) {
    case 'int':
    case 'int[]':
    case 'float':
    case 'float[]':
      return createNumberSchema(parameter)
    case 'bool':
    case 'bool[]':
    case 'string':
    case 'string[]':
    case 'video':
    case 'video[]':
    case 'image':
    case 'image[]':
    case 'lora':
    case 'lora[]':
      return createStringSchema(parameter)
    default:
      throw new Error(`${parameter.type} not supported.`)
  }
}

export function createZodFormSchema(parameters: GeneratorParameterV2[]) {
  const schemaObj = parameters.reduce((prev, curr) => {
    prev[curr.name] = createZodParameterSchema(curr)
    return prev
  }, {} as Record<string, ZodTypeAny>)

  return z.object(schemaObj)
}
