import FormItemHead from '@/components/form/form-item-head'
import FormItemWrap from '@/components/form/form-item-wrap'
import ModelSelector from '@/components/form/input/model-selector'
import SelectInput from '@/components/form/input/select-input'
import SliderInput from '@/components/form/input/slider-input'
import StringArrayInput from '@/components/form/input/string-array-input'
import LoadingIndicator from '@/components/loading-indicator'
import FileUploader from '@/components/media/file-uploader'
import { Button } from '@/components/ui/button'
import { AutosizeTextarea } from '@/components/ui/custom/autoresize-textarea'
import DialogContentOverlayBlur from '@/components/ui/custom/dialog-content-overlay-blur'
import { SwitchNoButton } from '@/components/ui/custom/switch-no-button'
import {
  Dialog,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import MaskingCanvas from '@/features/generators/masking-canvas'
import { cn } from '@/lib/utils'
import { GeneratorParameterV2, GeneratorV2 } from '@edenlabs/eden-sdk'
import { PaintbrushIcon } from 'lucide-react'
import { ReactNode, Suspense } from 'react'
import { UseFormReturn } from 'react-hook-form'

type Props = {
  parameter: GeneratorParameterV2
  tool: GeneratorV2
  form: UseFormReturn
  icon?: ReactNode
  className?: string
}

const maskPainterParameterNames = ['mask_image', 'control_input']

const ParameterField = ({ parameter, tool, form, icon, className }: Props) => {
  const { name, label } = parameter

  return (
    <FormField
      name={name}
      render={({ field, fieldState }) => {
        const { onChange, onBlur, value, name } = field
        let parsedValue: number | string | ''
        // console.log({ field })
        switch (parameter.type) {
          case 'int':
            parsedValue = Number(value)
            if (isNaN(parsedValue)) {
              parsedValue = ''
            }

            return (
              <FormItemWrap
                name={name}
                label={label}
                description={parameter.description}
                errorMessage={fieldState.error?.message}
                className={className}
              >
                {parameter.name === 'seed' ? (
                  <Input
                    type="number"
                    onChange={e =>
                      // @todo: handle as big number
                      onChange(
                        e.target.value ? parseInt(e.target.value) : undefined,
                      )
                    }
                    onBlur={onBlur}
                    value={parsedValue}
                  />
                ) : (
                  <SliderInput
                    type={parameter.type}
                    min={parameter.minimum || 0}
                    max={parameter.maximum || 1}
                    step={parameter.step ? parameter.step : 1}
                    value={value}
                    onChange={onChange}
                  />
                )}
              </FormItemWrap>
            )
          case 'float':
            return (
              <FormItemWrap
                name={name}
                label={label}
                description={parameter.description}
                errorMessage={fieldState.error?.message}
              >
                <SliderInput
                  type={parameter.type}
                  min={parameter.minimum || 0}
                  max={parameter.maximum || 1}
                  step={parameter.step ? parameter.step : 0.05}
                  value={value}
                  onChange={newVal => {
                    onChange(newVal)
                  }}
                />
              </FormItemWrap>
            )
          case 'bool':
            return (
              <FormItem
                className={cn([
                  'flex flex-row items-center justify-between rounded-lg p-4',
                  className,
                ])}
                data-test-id={parameter.name}
              >
                <FormItemHead
                  icon={icon}
                  label={label}
                  description={parameter.description}
                />
                <FormControl id={name} className="ml-4">
                  <SwitchNoButton
                    className="!mt-0 data-[state=unchecked]:!bg-gray-400 data-[state=unchecked]:dark:!bg-gray-700"
                    checked={value}
                    onCheckedChange={checked => onChange(checked)}
                  />
                </FormControl>
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )
          case 'string':
            return name === 'prompt' ||
              name === 'negative_prompt' ||
              name === 'text_input' ? (
              <FormItem
                className={`mt-0 !p-4 ${
                  parameter.required ? '!pt-4' : '!pt-3'
                }`}
                data-test-id={parameter.name}
              >
                {parameter.required ? (
                  <FormLabel className="sr-only">{label}</FormLabel>
                ) : (
                  <FormItemHead
                    label={label}
                    description={parameter.description}
                  />
                )}
                <FormControl id={name}>
                  <AutosizeTextarea
                    spellCheck={false}
                    placeholder={parameter.description}
                    className={`!ml-0 border-0 resize-none overflow-hidden rounded-lg ${
                      parameter.required
                        ? '!outline-none !p-4 !pt-2 !mt-0'
                        : 'rounded-lg border p-2 '
                    }`}
                    onChange={onChange}
                    onBlur={onBlur}
                    value={value || ''}
                  />
                </FormControl>
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            ) : (
              <FormItemWrap
                name={name}
                label={label}
                description={parameter.description}
                errorMessage={fieldState.error?.message}
              >
                {parameter.choices && parameter.choices.length ? (
                  <SelectInput
                    placeholder={label}
                    label={label}
                    onChange={onChange}
                    value={value}
                    options={parameter.choices}
                    optionLabels={parameter.choices_labels || undefined}
                  />
                ) : (
                  <>
                    <Input
                      type="text"
                      onChange={onChange}
                      onBlur={onBlur}
                      value={value || ''}
                    />
                  </>
                )}
              </FormItemWrap>
            )
          case 'string[]':
            return (
              <FormItem
                className="mt-0 !p-4 !pt-2"
                data-test-id={parameter.name}
              >
                <FormItemHead
                  label={label}
                  description={parameter.description}
                />
                <FormControl id={name}>
                  <Input
                    className={'hidden'}
                    onChange={onChange}
                    onBlur={onBlur}
                    value={value === null ? '' : value || ''}
                  />
                </FormControl>
                <StringArrayInput
                  minLength={
                    parameter.required
                      ? parameter.min_length !== undefined &&
                        parameter.min_length !== null
                        ? parameter.min_length
                        : 0
                      : 1
                  }
                  maxLength={parameter.max_length || 256}
                  onChange={onChange}
                  value={value === null ? [] : value || ['']}
                />
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )
          case 'lora':
            parsedValue = typeof value !== 'string' ? '' : value
            return (
              <FormItem
                className="mt-0 !p-4 !pt-2"
                data-test-id={parameter.name}
              >
                <FormItemHead
                  label={label}
                  description={parameter.description}
                />
                <FormControl id={name}>
                  <Input
                    className={'hidden'}
                    onChange={onChange}
                    onBlur={onBlur}
                    value={parsedValue}
                  />
                </FormControl>
                <Suspense fallback={<LoadingIndicator />}>
                  <ModelSelector
                    baseModel={tool.baseModel}
                    value={parsedValue}
                    onChange={onChange}
                  />
                </Suspense>
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )
          case 'image[]':
          case 'video[]':
          case 'image[]|video[]':
          case 'video[]|image[]':
            return (
              <FormItem
                className="mt-0 !p-4 !pt-2"
                data-test-id={parameter.name}
              >
                <FormItemHead
                  label={label}
                  description={parameter.description}
                />
                <FormControl id={name}>
                  <Input
                    className={'hidden'}
                    onChange={onChange}
                    onBlur={onBlur}
                    value={value === null ? '' : value || ''}
                  />
                </FormControl>
                <FileUploader
                  value={value === null ? [] : value || []}
                  onChange={onChange}
                  allowedFileTypes={parameter.type
                    .replaceAll('[]', '')
                    .split('|')}
                  maxFiles={
                    parameter.max_length === null ||
                    parameter.max_length === undefined
                      ? parameter.type.includes('video')
                        ? 128
                        : 256
                      : parameter.max_length || 1
                  }
                  allowMultiple={parameter.max_length !== 1}
                />
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )
          case 'image':
          case 'video':
          case 'image|video':
          case 'video|image':
            return (
              <FormItem
                className="mt-0 !p-4 !pt-2"
                data-test-id={parameter.name}
              >
                <FormItemHead
                  label={label}
                  description={parameter.description}
                />
                <FormControl id={name}>
                  <Input
                    className={'hidden'}
                    onChange={onChange}
                    onBlur={onBlur}
                    value={value === null ? '' : value || ''}
                  />
                </FormControl>
                <div className="flex md:flex-col gap-2 items-center w-full">
                  <FileUploader
                    value={value === null ? '' : value || ''}
                    onChange={onChange}
                    allowedFileTypes={parameter.type.split('|')}
                    maxFiles={1}
                    allowMultiple={false}
                    className={'w-full'}
                  />
                  {/* //@todo: use a dialog / modal */}
                  {/* //@todo: pass onChange to be called on save/submit */}
                  {/* //@todo: default (preset) or editing: pass mask image param to be used as default? */}
                  {maskPainterParameterNames.includes(parameter.name) ? (
                    <>
                      <div className="font-bold">or</div>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant={'outline'}>
                            <PaintbrushIcon className="h-5 w-5 mr-2" />
                            Draw Mask Image
                          </Button>
                        </DialogTrigger>
                        <DialogContentOverlayBlur>
                          <DialogTitle>
                            Mask Painter: {parameter.name}
                          </DialogTitle>
                          <DialogDescription>
                            Draw a masking image
                          </DialogDescription>
                          <MaskingCanvas
                            parameter={parameter}
                            inputImageFieldName={'image'}
                            form={form}
                          />
                        </DialogContentOverlayBlur>
                      </Dialog>
                    </>
                  ) : null}
                </div>
                <FormMessage>{fieldState.error?.message}</FormMessage>
              </FormItem>
            )
          default:
            return (
              <FormItemWrap
                name={name}
                label={label}
                description={parameter.description}
                errorMessage={fieldState.error?.message}
              >
                <Input
                  onChange={onChange}
                  onBlur={onBlur}
                  value={value === null ? '' : value}
                />
              </FormItemWrap>
            )
        }
      }}
    />
  )
}

export default ParameterField
