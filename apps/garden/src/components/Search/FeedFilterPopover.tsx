import FeedFilterButtons from '@/components/Search/FeedFilterButtons'
import {
  FeedSettingItem,
  FeedSettings,
  FeedSettingsContext,
} from '@/providers/FeedSettingsProvider'
import ExpandLess from '@mui/icons-material/ExpandLess'
import ExpandMore from '@mui/icons-material/ExpandMore'
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Radio,
  RadioGroup,
} from '@mui/material'
import Popover from '@mui/material/Popover'
import React, {
  ComponentPropsWithoutRef,
  MutableRefObject,
  ReactElement,
  useContext,
  useState,
} from 'react'

interface Item {
  label: string
  value: string
  defaultActive?: boolean
}

interface Group {
  id:
    | 'outputType'
    | 'visibility'
    | 'gridImageStyle'
    | 'imageSize'
    | 'generatorId'
  title: string
  type: 'single' | 'multi'
  items: Item[]
  defaultValue?: string
}

interface Segment {
  id: string
  title: string
  defaultOpen?: boolean
  groups: Group[]
}

const segments: Segment[] = [
  {
    id: 'filters',
    title: 'Filters',
    defaultOpen: true,
    groups: [
      {
        id: 'outputType',
        title: 'Output',
        type: 'multi',
        items: [
          {
            label: 'Images',
            value: 'image',
          },
          {
            label: 'Videos',
            value: 'video',
          },
        ],
      },
      {
        id: 'generatorId',
        title: 'Generator',
        type: 'multi',
        items: [
          {
            label: 'Create',
            value: 'create',
          },
          {
            label: 'Story',
            value: 'story',
          },
          {
            label: 'Upscale',
            value: 'upscale',
          },
          {
            label: 'ControlNet',
            value: 'controlnet',
          },
          {
            label: 'txt2vid',
            value: 'txt2vid',
          },
          {
            label: 'img2vid',
            value: 'img2vid',
          },
          {
            label: 'vid2vid',
            value: 'vid2vid',
          },
          {
            label: 'real2real',
            value: 'real2real',
          },
        ],
      },
      // @todo: mostly relevant for own profile feed
      // {
      //   id: 'visibility',
      //   title: 'Visibility',
      //   type: 'multi',
      //   items: [
      //     {
      //       label: 'Public',
      //       value: 'public',
      //     },
      //     {
      //       label: 'Private',
      //       value: 'private',
      //     },
      //   ],
      // },
    ],
  },
  // {
  //   id: 'view',
  //   title: 'View Options',
  //   defaultOpen: false,
  //   groups: [
  //     {
  //       id: 'gridImageStyle',
  //       title: 'Layout',
  //       type: 'single',
  //       defaultValue: 'full',
  //       items: [
  //         {
  //           label: 'Full',
  //           value: 'contain',
  //         },
  //         {
  //           label: 'Square',
  //           value: 'cover',
  //         },
  //       ],
  //     },
  //     {
  //       id: 'imageSize',
  //       title: 'Image Size',
  //       type: 'single',
  //       defaultValue: 'medium',
  //       items: [
  //         {
  //           label: 'Small',
  //           value: 'small',
  //         },
  //         {
  //           label: 'Medium',
  //           value: 'medium',
  //         },
  //         {
  //           label: 'Large',
  //           value: 'large',
  //         },
  //       ],
  //     },
  //   ],
  // },
]

interface ControlledAccordionProps extends ComponentPropsWithoutRef<'div'> {
  segment: Segment
  headerExtra?: ReactElement
}

const AccordionHeader = ({
  segment,
  children,
}: {
  segment: Segment
  children?: ReactElement
}) => {
  return (
    <div key={1} className="flex flex-col max-w-full">
      <AccordionSummary
        className="!h-10 !min-h-0 !hover:bg-gray-300 !hover:dark:bg-gray-700 !bg-slate-800 !border-0 text-gray-400 dark:text-gray-300 text-sm"
        expandIcon={<ExpandMore className="text-gray-700 dark:text-gray-300" />}
        aria-controls={`${segment.id}-content`}
        id={`${segment.id}-header`}
      >
        {segment.title}
      </AccordionSummary>
      {children}
    </div>
  )
}

const CheckboxGroup = ({
  group,
  feedSettings,
  onChange,
}: {
  group: Group
  feedSettings: FeedSettings
  onChange: (
    id: Group['id'],
    type: Group['type'],
    value: Item['value'],
    checked: boolean,
  ) => void
}) => {
  const numItemsVisible = 3
  const [showMore, setShowMore] = useState(false)

  return (
    <>
      {group.items && group.items.length
        ? group.items.map((item, index) => (
            <FormControlLabel
              className={`pl-1 text-sm !mr-0 ${
                !(feedSettings[group.id] as Record<string, boolean>)[
                  item.value
                ] &&
                index >= numItemsVisible &&
                !showMore
                  ? 'hidden'
                  : ''
              }`}
              key={item.label}
              control={
                <Checkbox
                  size="small"
                  name={group.id}
                  checked={
                    (feedSettings[group.id] as Record<string, boolean>)[
                      item.value
                    ]
                  }
                />
              }
              label={<span className="text-sm select-none">{item.label}</span>}
              onChange={(event, checked) =>
                onChange(group.id, group.type, item.value, checked)
              }
            />
          ))
        : null}
      {group.items.length > 3 ? (
        <div
          onClick={() => setShowMore(!showMore)}
          className={`text-gray-400 flex items-center gap-1 text-xs cursor-pointer hover:underline hover:text-gray-300 ${
            group.items.length >= numItemsVisible ? '' : 'hidden'
          }`}
        >
          {showMore ? (
            <>
              <ExpandLess fontSize="small" className="w-6" /> Show less
            </>
          ) : (
            <>
              <ExpandMore fontSize="small" className="w-6" /> Show more
            </>
          )}
        </div>
      ) : null}
    </>
  )
}

const AccordionBody = ({ segment }: { segment: Segment }) => {
  const { feedSettings, updateFeedSettings } = useContext(FeedSettingsContext)

  const handleItemChange = (
    groupId: Group['id'],
    type: Group['type'],
    value: Item['value'],
    checked: boolean,
  ) => {
    updateFeedSettings((current: FeedSettings) => {
      const newState = { ...current }

      if (type === 'multi') {
        // We assert that newState[groupId] is a 'FeedSettingItem'
        const group = newState[groupId] as FeedSettingItem
        group[value] = checked
      } else if (groupId === 'gridImageStyle' || groupId === 'imageSize') {
        // We knowingly can assert that newState[groupId] can take a string here
        (newState[groupId] as string) = value
      }

      return newState
    })
  }

  return (
    <AccordionDetails
      key={2}
      className="pb-0 text-gray-700 dark:text-gray-300"
      id={`${segment.id}-content`}
    >
      {segment?.groups?.map(group => (
        <div key={group.title} className="mb-2">
          <div className="text-sm pb-0.5">{group.title}</div>
          {group.type === 'single' ? (
            <RadioGroup
              name={group.id}
              aria-labelledby="demo-radio-buttons-group-label"
              value={feedSettings[group.id]}
            >
              {group.items && group.items.length
                ? group.items.map(item => (
                    <FormControlLabel
                      className="pl-1 text-sm !mr-0"
                      key={item.label}
                      control={<Radio size="small" value={item.value} />}
                      label={
                        <span className="text-sm select-none">
                          {item.label}
                        </span>
                      }
                      onChange={(evt, checked) =>
                        handleItemChange(
                          group.id,
                          group.type,
                          item.value,
                          checked,
                        )
                      }
                    />
                  ))
                : null}
            </RadioGroup>
          ) : (
            <FormGroup className="mb-2">
              <CheckboxGroup
                group={group}
                feedSettings={feedSettings}
                onChange={handleItemChange}
              />
            </FormGroup>
          )}
        </div>
      ))}
    </AccordionDetails>
  )
}

const ControlledAccordion = ({
  segment,
  headerExtra,
  ...rest
}: ControlledAccordionProps) => {
  const [expanded, setExpanded] = useState<boolean>(
    segment.defaultOpen || false,
  )

  const handleChange = (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded)
  }

  return (
    <Accordion expanded={expanded} {...rest} onChange={handleChange}>
      <AccordionHeader segment={segment}>
        {headerExtra && !expanded ? headerExtra : undefined}
      </AccordionHeader>
      <AccordionBody segment={segment} />
    </Accordion>
  )
}

const FeedFilterPopover = ({
  containerRef,
  open,
  handleClose,
  anchorEl,
}: {
  containerRef?: MutableRefObject<HTMLDivElement>
  open: boolean
  handleClose: () => void
  anchorEl: HTMLDivElement | null
}) => {
  return (
    <Popover
      id={'feed-filter-popover'}
      // disableScrollLock={true}
      container={containerRef?.current || undefined}
      open={open}
      anchorEl={anchorEl}
      onClose={handleClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      style={{ background: 'transparent' }}
    >
      {segments.map(segment => (
        <ControlledAccordion
          key={segment.id}
          segment={segment}
          headerExtra={
            segment.id === 'filters' ? <FeedFilterButtons /> : undefined
          }
          className="w-[160px] !m-0"
        />
      ))}
    </Popover>
  )
}

export default FeedFilterPopover
