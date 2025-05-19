'use client'

import 'katex/dist/katex.min.css'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { CheckIcon, CopyIcon } from 'lucide-react'
import React, { FC, memo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'

interface CodeHeaderProps {
  language: string
  code: string
}

const CodeHeader: FC<CodeHeaderProps> = ({ language, code }) => {
  const { isCopied, copyToClipboard } = useCopyToClipboard()
  const onCopy = () => {
    if (!code || isCopied) return
    copyToClipboard(code)
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-t-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white">
      <span className="lowercase [&>span]:text-xs">{language}</span>
      <Button
        variant="ghost"
        size="sm"
        className="h-8 w-8 p-0"
        onClick={onCopy}
      >
        {!isCopied && <CopyIcon className="h-4 w-4" />}
        {isCopied && <CheckIcon className="h-4 w-4" />}
      </Button>
    </div>
  )
}

const useCopyToClipboard = ({
  copiedDuration = 3000,
}: {
  copiedDuration?: number
} = {}) => {
  const [isCopied, setIsCopied] = useState<boolean>(false)

  const copyToClipboard = (value: string) => {
    if (!value) return

    navigator.clipboard.writeText(value).then(() => {
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), copiedDuration)
    })
  }

  return { isCopied, copyToClipboard }
}

interface MarkdownTextProps {
  children: string
}

const MarkdownTextImpl: FC<MarkdownTextProps> = ({ children }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        h1: ({ className, ...props }) => (
          <h1
            className={cn(
              'mb-8 scroll-m-20 text-4xl font-extrabold tracking-tight last:mb-0',
              className,
            )}
            {...props}
          />
        ),
        h2: ({ className, ...props }) => (
          <h2
            className={cn(
              'mb-4 mt-8 scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0 last:mb-0',
              className,
            )}
            {...props}
          />
        ),
        h3: ({ className, ...props }) => (
          <h3
            className={cn(
              'mb-4 mt-6 scroll-m-20 text-2xl font-semibold tracking-tight first:mt-0 last:mb-0',
              className,
            )}
            {...props}
          />
        ),
        h4: ({ className, ...props }) => (
          <h4
            className={cn(
              'mb-4 mt-6 scroll-m-20 text-xl font-semibold tracking-tight first:mt-0 last:mb-0',
              className,
            )}
            {...props}
          />
        ),
        h5: ({ className, ...props }) => (
          <h5
            className={cn(
              'my-4 text-lg font-semibold first:mt-0 last:mb-0',
              className,
            )}
            {...props}
          />
        ),
        h6: ({ className, ...props }) => (
          <h6
            className={cn('my-4 font-semibold first:mt-0 last:mb-0', className)}
            {...props}
          />
        ),
        p: ({ className, ...props }) => (
          <p
            className={cn(
              'mb-5 mt-5 leading-7 first:mt-0 last:mb-0',
              className,
            )}
            {...props}
          />
        ),
        a: ({ className, ...props }) => (
          <a
            target="_blank"
            className={cn(
              'text-primary font-medium underline underline-offset-4',
              className,
            )}
            {...props}
          />
        ),
        blockquote: ({ className, ...props }) => (
          <blockquote
            className={cn('border-l-2 pl-6 italic', className)}
            {...props}
          />
        ),
        ul: ({ className, ...props }) => (
          <ul
            className={cn('my-5 ml-6 list-disc [&>li]:mt-2', className)}
            {...props}
          />
        ),
        ol: ({ className, ...props }) => (
          <ol
            className={cn('my-5 ml-6 list-decimal [&>li]:mt-2', className)}
            {...props}
          />
        ),
        hr: ({ className, ...props }) => (
          <hr className={cn('my-5 border-b', className)} {...props} />
        ),
        table: ({ className, ...props }) => (
          <table
            className={cn(
              'my-5 w-full border-separate border-spacing-0 overflow-y-auto',
              className,
            )}
            {...props}
          />
        ),
        th: ({ className, ...props }) => (
          <th
            className={cn(
              'bg-muted px-4 py-2 text-left font-bold first:rounded-tl-lg last:rounded-tr-lg [&[align=center]]:text-center [&[align=right]]:text-right',
              className,
            )}
            {...props}
          />
        ),
        td: ({ className, ...props }) => (
          <td
            className={cn(
              'border-b border-l px-4 py-2 text-left last:border-r [&[align=center]]:text-center [&[align=right]]:text-right',
              className,
            )}
            {...props}
          />
        ),
        tr: ({ className, ...props }) => (
          <tr
            className={cn(
              'm-0 border-b p-0 first:border-t [&:last-child>td:first-child]:rounded-bl-lg [&:last-child>td:last-child]:rounded-br-lg',
              className,
            )}
            {...props}
          />
        ),
        sup: ({ className, ...props }) => (
          <sup
            className={cn('[&>a]:text-xs [&>a]:no-underline', className)}
            {...props}
          />
        ),
        pre: ({ className, ...props }) => (
          <pre
            className={cn('overflow-x-auto text-white', className)}
            {...props}
          />
        ),
        code: ({ className, children, ...props }) => {
          const match = /language-(\w+)/.exec(className || '')
          const language = match ? match[1] : ''
          const code = String(children).replace(/\n$/, '')

          if (language) {
            return (
              <div className="relative">
                <CodeHeader language={language} code={code} />
                <SyntaxHighlighter
                  language={language}
                  // @ts-ignore
                  style={vscDarkPlus}
                  PreTag="div"
                  className="!mt-0 !rounded-t-none rounded-b-lg"
                  {...props}
                >
                  {code}
                </SyntaxHighlighter>
              </div>
            )
          }

          return (
            <code
              className={cn('bg-muted rounded border font-semibold', className)}
              {...props}
            >
              {children}
            </code>
          )
        },
      }}
    >
      {children}
    </ReactMarkdown>
  )
}

export const MarkdownText = memo(MarkdownTextImpl)
