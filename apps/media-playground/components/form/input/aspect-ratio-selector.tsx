import AspectRatioDropdown from '@/components/form/input/aspect-ratio-dropdown'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { UseFormReturn } from 'react-hook-form'

export type Resolution = {
  label: string
  width: number
  height: number
}

const RESOLUTIONS: Resolution[] = [
  {
    label: '9:21',
    width: 640,
    height: 1536,
  },
  {
    label: '9:16',
    width: 768,
    height: 1344,
  },
  {
    label: '2:3',
    width: 832,
    height: 1216,
  },
  {
    label: '3:4',
    width: 896,
    height: 1152,
  },
  {
    label: '1:1',
    width: 1024,
    height: 1024,
  },
  {
    label: '4:3',
    width: 1152,
    height: 896,
  },
  {
    label: '3:2',
    width: 1216,
    height: 832,
  },
  {
    label: '16:9',
    width: 1344,
    height: 768,
  },
  {
    label: '21:9',
    width: 1536,
    height: 640,
  },
]

type Props = {
  form: UseFormReturn
}

const AspectRatioSelector = ({ form }: Props) => {
  const widthWatch = form.watch('width')
  const heightWatch = form.watch('height')
  // console.log({ widthWatch, heightWatch })

  const activeIndex = RESOLUTIONS.findIndex(
    res => res.width === widthWatch && res.height === heightWatch,
  )
  const activeResolution = RESOLUTIONS[activeIndex]

  const squareAspectIndex = RESOLUTIONS.findIndex(res => res.label === '1:1')
  const squareResolution = RESOLUTIONS[squareAspectIndex]

  const landscapeIndex = activeResolution
    ? RESOLUTIONS.findIndex(
        res =>
          (res.width === activeResolution.width &&
            res.height === activeResolution.height &&
            res.width > res.height) ||
          (res.width === activeResolution.height &&
            res.height === activeResolution.width &&
            res.width > res.height),
      )
    : RESOLUTIONS.length - 1
  const landscapeResolution =
    RESOLUTIONS[landscapeIndex !== -1 ? landscapeIndex : RESOLUTIONS.length - 1]

  const portraitIndex = activeResolution
    ? RESOLUTIONS.findIndex(
        res =>
          (res.width === activeResolution.width &&
            res.height === activeResolution.height &&
            res.width < res.height) ||
          (res.width === activeResolution.height &&
            res.height === activeResolution.width &&
            res.width < res.height),
      )
    : 0
  const portraitResolution =
    RESOLUTIONS[portraitIndex !== -1 ? portraitIndex : 0]

  // console.log({
  //   activeIndex,
  //   activeResolution,
  //   landscapeResolution,
  //   squareResolution,
  //   portraitResolution,
  // })

  const visibleResolutions = [
    portraitResolution,
    squareResolution,
    landscapeResolution,
  ]

  // console.log(visibleResolutions)

  const updateFormValues = (resolution: Resolution) => {
    form.setValue('width', resolution.width)
    form.setValue('height', resolution.height)
  }

  return (
    <ToggleGroup
      type="single"
      value={activeResolution ? activeResolution.label : undefined}
      className="border border-muted rounded-md p-1 flex items-center"
    >
      {visibleResolutions.map(resolution => (
        <ToggleGroupItem
          key={`${resolution.label}`}
          value={resolution.label}
          aria-label={`Select aspect ratio: ${resolution.label}`}
          asChild
          className="px-1 data-[state=on]:bg-muted data-[state=on]:text-muted-foreground"
        >
          <div
            className={
              'flex items-center gap-1 h-9 w-16 cursor-pointer text-xs rounded-sm justify-center'
            }
            onClick={() => updateFormValues(resolution)}
          >
            <div
              className="border border-primary h-full w-full"
              style={{
                aspectRatio: resolution.width / resolution.height,
                maxHeight:
                  resolution.width / resolution.height > 1 ? '12px' : '20px',
                maxWidth:
                  resolution.width / resolution.height < 1 ? '12px' : '20px',
              }}
            />
            {resolution.label}
          </div>
        </ToggleGroupItem>
      ))}
      <AspectRatioDropdown
        resolutions={RESOLUTIONS}
        activeResolution={activeResolution || undefined}
        onClick={(resolution: Resolution) => updateFormValues(resolution)}
      />
    </ToggleGroup>
  )
}

export default AspectRatioSelector
