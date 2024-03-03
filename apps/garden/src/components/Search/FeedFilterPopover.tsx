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
} from '@mui/material'
import Popover from '@mui/material/Popover'
import React, { ComponentPropsWithoutRef, ReactElement } from 'react'

const segments = [
  {
    id: 'filters',
    title: 'Filters',
    defaultOpen: true,
    groups: [
      {
        title: 'Type',
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
          {
            label: 'Stories',
            value: 'story',
          },
        ],
      },
      {
        title: 'Visibility',
        type: 'multi',
        items: [
          {
            label: 'Public',
            value: { isPrivate: false },
          },
          {
            label: 'Private',
            value: { isPrivate: true },
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
        title: 'Layout',
        type: 'single',
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
        title: 'Image Size',
        type: 'single',
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

// type FilterParam = {
//   value: string
// }

interface ControlledAccordionProps extends ComponentPropsWithoutRef<'div'> {
  defaultOpen?: boolean
  children: ReactElement[]
}

const ControlledAccordion = ({
  defaultOpen,
  children,
  ...rest
}: ControlledAccordionProps & AccordionProps) => {
  const [expanded, setExpanded] = React.useState<boolean>(defaultOpen || false)

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
  // const [ filters, setFilters ] = useState<FilterParam[]>([])

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
                  <FormGroup className="mb-2">
                    {group.items && group.items.length
                      ? group.items.map(item => (
                          <FormControlLabel
                            className="pl-1 text-sm !mr-0"
                            key={item.label}
                            control={
                              group.type === 'multi' ? (
                                <Checkbox
                                  size="small"
                                  // checked={item.hasItem}
                                  // disabled={
                                  //   loadingItem !== null && loadingItem._id === item._id
                                  // }
                                />
                              ) : (
                                <Radio
                                  size="small"
                                  // checked={item.hasItem}
                                  // disabled={
                                  //   loadingItem !== null && loadingItem._id === item._id
                                  // }
                                />
                              )
                            }
                            label={
                              <span className="text-sm select-none">
                                {item.label}
                              </span>
                            }
                            // onChange={() => handleItemChange(item)}
                          />
                        ))
                      : null}
                  </FormGroup>
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
