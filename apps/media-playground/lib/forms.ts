import { GeneratorParameterV2 } from '@edenlabs/eden-sdk'
import {
  ZodArray,
  ZodBoolean,
  ZodDefault,
  ZodNumber,
  ZodOptional,
  ZodString,
  ZodTypeAny,
  z,
} from 'zod'

function defaultHelper<T extends ZodTypeAny>(
  schema: T,
  defaultValue: string | number | null | undefined,
): (T & ZodDefault<T>) | T {
  if (defaultValue !== undefined && defaultValue !== null) {
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
  let schema: z.ZodNumber = z.number()

  if (parameter.minimum !== undefined && parameter.minimum !== null) {
    schema = schema.min(parameter.minimum)
  }

  if (parameter.maximum !== undefined && parameter.maximum !== null) {
    schema = schema.max(parameter.maximum)
  }

  if (parameter.type === 'int' || parameter.type === 'int[]') {
    //@ts-expect-error: refine returns ZodEffect<ZodType> which confused things
    schema = schema.refine(Number.isInteger, 'Must be an integer')
  }

  schema = defaultHelper(schema, parameter.default)
  schema = optionalHelper(schema, !parameter.required)

  return schema
}

function createBoolSchema(
  parameter: GeneratorParameterV2,
): ZodBoolean | ZodOptional<ZodBoolean> | ZodDefault<ZodBoolean> {
  let schema: ZodBoolean = z.boolean()

  schema = defaultHelper(schema, parameter.default)
  schema = optionalHelper(schema, !parameter.required)

  return schema
}

function createStringSchema(
  parameter: GeneratorParameterV2,
): ZodString | ZodOptional<ZodString> | ZodDefault<ZodString> {
  let schema: ZodString = z.string()

  if (parameter.min_length !== undefined && parameter.min_length !== null) {
    schema = schema.min(
      parameter.min_length,
      `Must be at least ${parameter.min_length} characters long`,
    )
  }
  if (parameter.max_length !== undefined && parameter.max_length !== null) {
    schema = schema.max(
      parameter.max_length,
      `Must be less than ${parameter.max_length} characters long`,
    )
  }

  schema = defaultHelper(schema, parameter.default)
  schema = optionalHelper(schema, !parameter.required)

  return schema
}

function createFileUrlSchema(
  parameter: GeneratorParameterV2,
): ZodString | ZodOptional<ZodString> | ZodDefault<ZodString> {
  let schema: ZodString = z.string()

  schema = defaultHelper(schema, parameter.default)
  schema = optionalHelper(schema, !parameter.required)

  return schema
}

function createFileUrlArraySchema(
  parameter: GeneratorParameterV2,
):
  | ZodArray<ZodString>
  | ZodOptional<ZodArray<ZodString>>
  | ZodDefault<ZodArray<ZodString>> {
  let schema: ZodArray<ZodString> = z.array(z.string())

  if (parameter.min_length !== undefined && parameter.min_length !== null) {
    schema = schema.min(
      parameter.min_length,
      `Must provide at least ${parameter.min_length} file`,
    )
  }
  if (parameter.max_length !== undefined && parameter.max_length !== null) {
    schema = schema.max(
      parameter.max_length,
      `Must provide less than ${parameter.max_length} files`,
    )
  }

  schema = defaultHelper(schema, parameter.default)
  schema = optionalHelper(schema, !parameter.required)

  return schema
}

function createStringArraySchema(
  parameter: GeneratorParameterV2,
):
  | ZodArray<ZodString>
  | ZodOptional<ZodArray<ZodString>>
  | ZodDefault<ZodArray<ZodString>> {
  let schema: ZodArray<ZodString> = z.array(z.string())

  if (
    parameter.required ||
    (parameter.min_length !== undefined && parameter.min_length !== null)
  ) {
    const min =
      parameter.min_length !== undefined && parameter.min_length !== null
        ? parameter.min_length
        : 1
    schema = schema.min(
      min,
      `Must provide at least ${min} value${min > 1 ? 's' : ''}`,
    )
  }
  if (parameter.max_length !== undefined && parameter.max_length !== null) {
    schema = schema.max(
      parameter.max_length,
      `Must provide less than ${parameter.max_length} values`,
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
      return createBoolSchema(parameter)
    case 'string':
    case 'lora':
      return createStringSchema(parameter)
    case 'string[]':
    case 'lora[]':
      return createStringArraySchema(parameter)
    case 'video':
    case 'image':
    case 'image|video':
    case 'video|image':
      return createFileUrlSchema(parameter)
    case 'video[]':
    case 'image[]':
    case 'image[]|video[]':
    case 'video[]|image[]':
      return createFileUrlArraySchema(parameter)
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

export function getDefaultNameValueMap(parameters?: GeneratorParameterV2[]) {
  return (parameters || []).reduce((accum, currParameter) => {
    return {
      ...accum,
      [currParameter.name]: currParameter.default,
    }
  }, {})
}
