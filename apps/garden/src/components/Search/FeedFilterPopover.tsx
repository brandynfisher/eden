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
  useEffect,
  useState,
} from 'react'

interface Item {
  label: string
  value: string | {}
  defaultActive?: boolean
}

interface Group {
  id: string
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
            defaultActive: true,
          },
          {
            label: 'Videos',
            value: 'video',
            defaultActive: true,
          },
          {
            label: 'Stories',
            value: 'story',
            defaultActive: false,
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
            defaultActive: true,
          },
          {
            label: 'Private',
            value: 'private',
            defaultActive: false,
          },
        ],
      },
    ],
  },
  {
    id: 'view',
    title: 'View',
    defaultOpen: false,
    groups: [
      {
        id: 'layout',
        title: 'Layout',
        type: 'single',
        defaultValue: 'full',
        items: [
          {
            label: 'Full',
            value: 'full',
          },
          {
            label: 'Square',
            value: 'square',
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

type FilterParams = {}

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
  const [filters, setFilters] = useState<FilterParams>({})

  useEffect(() => {
    console.log(filters)
  }, [filters])

  const handleItemChange = (
    groupId: Group['id'],
    type: Group['type'],
    value: Group['defaultValue'],
  ) => {
    setFilters(prev => {
      if (type === 'multi') {
        // If this checkbox group doesn't exist yet in the filters object,
        // create an empty object for it.
        if (!(groupId in prev)) {
          prev[groupId] = {}
        }

        // If the checkbox was previously checked, remove it
        if (prev[groupId][value]) {
          const newGroup = { ...prev[groupId] }
          delete newGroup[value]
          return { ...prev, [groupId]: newGroup }
        }

        // Otherwise add it
        return { ...prev, [groupId]: { ...prev[groupId], [value]: true } }
      } else {
        // For 'single' type, just store the value directly
        return { ...prev, [groupId]: value }
      }
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
    >
      {segments.map(segment => (
        <ControlledAccordion
          key={segment.id}
          defaultOpen={segment.defaultOpen}
          className="min-w-[160px] !m-0 controlled-accordion"
        >
          {[
            <AccordionSummary
              key={1}
              className={`!h-10 !min-h-0 hover:dark:bg-gray-700 bg-slate-800 !border-0 text-gray-300`}
              expandIcon={<ExpandMore className="text-gray-300" />}
              aria-controls={`${segment.id}-content`}
              id={`${segment.id}-header`}
            >
              {segment.title}
            </AccordionSummary>,
            <AccordionDetails
              key={2}
              className="pb-0 text-gray-300"
              id={`${segment.id}-content`}
            >
              {segment?.groups?.map(group => (
                <div key={group.title}>
                  <div className="text-sm pb-0.5">{group.title}</div>
                  {group.type === 'single' ? (
                    <RadioGroup
                      name={group.id}
                      aria-labelledby="demo-radio-buttons-group-label"
                      defaultValue={group.defaultValue}
                    >
                      {group.items && group.items.length
                        ? group.items.map(item => (
                            <FormControlLabel
                              className="pl-1 text-sm !mr-0"
                              key={item.label}
                              control={
                                <Radio
                                  size="small"
                                  value={item.value}
                                  // defaultChecked={group.defaultValue === item.value}
                                  // checked={filters[group.id] && filters[group.id].value === item.value}
                                />
                              }
                              label={
                                <span className="text-sm select-none">
                                  {item.label}
                                </span>
                              }
                              onChange={() =>
                                handleItemChange(
                                  group.id,
                                  group.type,
                                  item.value,
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
                                  defaultChecked={item.defaultActive}
                                />
                              }
                              label={
                                <span className="text-sm select-none">
                                  {item.label}
                                </span>
                              }
                              onChange={() =>
                                handleItemChange(
                                  group.id,
                                  group.type,
                                  item.value,
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
