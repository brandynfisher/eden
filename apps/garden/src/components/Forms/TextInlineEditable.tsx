import { handleAxiosError } from '@/lib/fetcher'
import { useClickOutside } from '@mantine/hooks'
import { App, Button } from 'antd'
import React, { useState } from 'react'

const TextInlineEditable = ({
  text,
  placeholder,
  onEditStop,
  onSubmit,
  validator,
}: {
  text: string
  placeholder: string
  onEditStop: () => void
  onSubmit: (updatedText: string) => Promise<void>
  validator?: (updatedText: string) => boolean
}) => {
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)
  const [updatedText, setUpdatedText] = useState(text)
  const clickOutsideTargetRef = useClickOutside(() => onEditStop())

  const handleInputChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = ev.target.value

    if (validator) {
      const isValid = validator(newValue)
      if (!isValid) {
        return
      }
    }

    setUpdatedText(newValue.trim())
  }

  const handleSubmit = async () => {
    setLoading(true)
    message.destroy()

    try {
      await onSubmit(updatedText)
      onEditStop()
    } catch (err) {
      handleAxiosError(err, message)
    }
    setLoading(false)
  }

  return (
    <div
      ref={clickOutsideTargetRef}
      className="relative w-full flex flex-col min-w-0 z-10"
    >
      <input
        autoFocus={true}
        type="text"
        enterKeyHint="enter"
        value={updatedText}
        placeholder={placeholder}
        maxLength={32}
        minLength={3}
        autoCorrect="off"
        spellCheck="false"
        className="z-10 ml-0 border-none shadow-none !ring-none flex h-7 max-w-full items-center  bg-gray-100 dark:bg-gray-950 pl-1 rounded-md underline decoration-dotted decoration-2 underline-offset-[3px] !outline-none placeholder:text-xs placeholder:font-normal"
        onChange={handleInputChange}
      />
      <div className="z-0 flex gap-2 absolute bg-white dark:bg-gray-800 p-2 top-full border border-gray-300 dark:border-gray-700 border-solid border-t-0 rounded-b-md anim-slide-fade-down ">
        <Button
          size="small"
          type="text"
          className="font-mono text-gray-500"
          onClick={() => onEditStop()}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          size="small"
          type="text"
          loading={loading}
          disabled={!updatedText || updatedText === text}
          className="font-mono"
        >
          Save
        </Button>
      </div>
    </div>
  )
}

export default TextInlineEditable
