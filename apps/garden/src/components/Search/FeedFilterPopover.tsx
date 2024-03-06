import FeedFilterButtons from '@/components/Search/FeedFilterButtons'
import {
  FeedSettingItem,
  FeedSettings,
  FeedSettingsContext,
} from '@/providers/FeedSettingsProvider'
import { ExpandMore } from '@mui/icons-material'
import {
  Accordion,
  AccordionDetails,
  AccordionProps,
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
  id: 'type' | 'visibility' | 'gridImageStyle' | 'imageSize'
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
        id: 'type',
        title: 'Type',
        type: 'multi',
        items: [
          {
            label: 'Images',
            value: 'image',
            // defaultActive: false,
          },
          {
            label: 'Videos',
            value: 'video',
            // defaultActive: false,
          },
          {
            label: 'Stories',
            value: 'story',
            // defaultActive: false,
          },
        ],
      },
      {
        id: 'visibility',
        title: 'Visibility',
        type: 'multi',
        items: [
          {
            label: 'Public',
            value: 'public',
            // defaultActive: false,
          },
          {
            label: 'Private',
            value: 'private',
            // defaultActive: false,
          },
        ],
      },
    ],
  },
  {
    id: 'view',
    title: 'View Options',
    defaultOpen: false,
    groups: [
      {
        id: 'gridImageStyle',
        title: 'Layout',
        type: 'single',
        defaultValue: 'full',
        items: [
          {
            label: 'Full',
            value: 'contain',
          },
          {
            label: 'Square',
            value: 'cover',
          },
        ],
      },
      {
        id: 'imageSize',
        title: 'Image Size',
        type: 'single',
        defaultValue: 'medium',
        items: [
          {
            label: 'Small',
            value: 'small',
          },
          {
            label: 'Medium',
            value: 'medium',
          },
          {
            label: 'Large',
            value: 'large',
          },
        ],
      },
    ],
  },
]

interface ControlledAccordionProps extends ComponentPropsWithoutRef<'div'> {
  defaultOpen?: boolean
  children: ReactElement[]
}

const ControlledAccordion = ({
  defaultOpen,
  children,
  ...rest
}: ControlledAccordionProps & AccordionProps) => {
  const [expanded, setExpanded] = useState<boolean>(defaultOpen || false)

  const handleChange = (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded)
  }

  return (
    <Accordion expanded={expanded} onChange={handleChange} {...rest}>
      {children}
    </Accordion>
  )
}

const FeedFilterPopover = ({
  open,
  handleClose,
  anchorEl,
}: {
  open: boolean
  handleClose: () => void
  anchorEl: HTMLDivElement | null
}) => {
  const { feedSettings, updateFeedSettings } = useContext(FeedSettingsContext)

  // useEffect(() => {
  //   console.log('UPDATING FEED SETTINGS', settings)
  //   updateFeedSettings(settings)
  // }, [settings])

  // const handleItemChange = (
  //   groupId: Group['id'],
  //   type: Group['type'],
  //   value: Item['value'],
  //   checked: boolean
  // ) => {
  //   if (type === 'multi') {
  //     console.log('multi')
  //     updateFeedSettings((current: FeedSettings) => {
  //       const newState = { ...current }
  //
  //       newState[groupId][value] = checked
  //
  //       console.log({newState})
  //
  //       return {
  //         ...current,
  //         ...newState
  //       }
  //     })
  //   //   updateFeedSettings(prev => {
  //   //     const prevState = {...prev}
  //   //     if (!(groupId in prevState)) {
  //   //       prevState[groupId] = {};
  //   //     }
  //   //
  //   //     if (typeof prevState[groupId] === 'object' && typeof value === 'string') {
  //   //       //@ts-ignore
  //   //       if (prevState[groupId][value]) {
  //   //         const newGroup = { ...prevState[groupId] as {[key: string]: boolean} };
  //   //         delete newGroup[value];
  //   //         return { ...prevState, [groupId]: newGroup };
  //   //       }
  //   //
  //   //       return { ...prevState, [groupId]: { ...(prevState[groupId] as {[key: string]: boolean}), [value]: true } };
  //   //     }
  //   //     return prevState;
  //   //   });
  //   } else {
  //     console.log('single')
  //     updateFeedSettings((current: FeedSettings) => {
  //       const newState = { ...current }
  //       // if (!isFeedSettingsKey(groupId)) {
  //       //   return current
  //       // }
  //       //
  //       newState[groupId] = value
  //
  //       return {
  //         ...current,
  //         ...newState
  //       }
  //     })
  //   //   updateFeedSettings(prev => {
  //   //     if (typeof value === 'string') {
  //   //       return { ...prev, [groupId]: value };
  //   //     }
  //   //     return prev;
  //   //   });
  //   }
  // };

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
    <Popover
      id={'feed'}
      open={open}
      anchorEl={anchorEl}
      onClose={handleClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'left',
      }}
      className="border border-solid border-gray-600 rounded-lg overflow-hidden p-2"
      style={{ background: 'transparent' }}
    >
      {segments.map(segment => (
        <ControlledAccordion
          key={segment.id}
          defaultOpen={segment.defaultOpen}
          className="min-w-[160px] !m-0 controlled-accordion [&:not(:last-child)]:!mb-4"
        >
          {[
            <div key={1}>
              <AccordionSummary
                className="!h-10 !min-h-0 hover:dark:bg-gray-700 bg-slate-800 !border-0 text-gray-300 text-sm"
                expandIcon={<ExpandMore className="text-gray-300" />}
                aria-controls={`${segment.id}-content`}
                id={`${segment.id}-header`}
              >
                {segment.title}
              </AccordionSummary>
              {segment.id === 'filters' ? <FeedFilterButtons /> : null}
            </div>,
            <AccordionDetails
              key={2}
              className="pb-0 text-gray-300"
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
                              control={
                                <Radio size="small" value={item.value} />
                              }
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
                      {group.items && group.items.length
                        ? group.items.map(item => (
                            <FormControlLabel
                              className="pl-1 text-sm !mr-0"
                              key={item.label}
                              control={
                                <Checkbox
                                  size="small"
                                  name={group.id}
                                  checked={
                                    (
                                      feedSettings[group.id] as Record<
                                        string,
                                        boolean
                                      >
                                    )[item.value]
                                  }
                                />
                              }
                              label={
                                <span className="text-sm select-none">
                                  {item.label}
                                </span>
                              }
                              onChange={(event, checked) =>
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
                    </FormGroup>
                  )}
                </div>
              ))}
            </AccordionDetails>,
          ]}
        </ControlledAccordion>
      ))}
    </Popover>
  )
}

export default FeedFilterPopover
