import { Input, Popover } from 'antd'
import React from 'react'

const InputAddon = ({
  title,
  textArea,
  info,
}: {
  title: string
  info?: string
  textArea?: boolean
}) => {
  return (
    <div
      className={`parameter ${
        textArea ? 'parameter--textarea' : ''
      } hover:brightness-90 dark:hover:brightness-125 cursor-help hover:text-blue-500`}
    >
      <Input
        style={{
          width: !textArea ? 68 : '100%',
          borderTopRightRadius: textArea ? '6px' : 0,
          borderBottomRightRadius: 0,
          pointerEvents: 'none',
        }}
        className={`parameter__addon h-full !px-2 !m-0 text-xs !bg-stone-200 dark:!bg-stone-900 min-w-[116px] ${
          textArea
            ? '!border-b-0 rounded-bl-none rounded-b-none rounded-br-none'
            : 'border-r-0'
        }`}
        placeholder={info ? title + ' ' + info : title}
        disabled
      />
    </div>
  )
}

export const ParameterAddon = ({
  title,
  info,
  description,
  textArea,
}: {
  title: string
  info?: string
  description?: string
  textArea?: boolean
}) => {
  if (!description) {
    return (
      <div className="h-full min-w-16">
        <InputAddon title={title} info={info} textArea={textArea} />
      </div>
    )
  }

  return (
    <Popover
      content={<div className="max-w-sm">{description}</div>}
      title={title}
      trigger={['click', 'hover']}
    >
      <div className="h-full">
        <InputAddon title={title} info={info} textArea={textArea} />
      </div>
    </Popover>
  )
}

export default ParameterAddon
