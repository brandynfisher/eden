'use client'

import { MarkdownText } from '@/components/ui/assistant-ui/markdown-text'
import { Button, ButtonProps } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import Thread from '@/features/chat/components/thread'
import MyThreadWelcome from '@/features/chat/components/thread-welcome'
import { TaskResultTool } from '@/features/chat/components/tools/task-result-tool'
import { ToolFallback } from '@/features/chat/components/tools/tool-fallback'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { cn } from '@/lib/utils'
import { AssistantV2 } from '@/types/Assistant'
import {
  ThreadListItemPrimitive,
  ThreadListPrimitive,
  useThreadList,
} from '@assistant-ui/react'
import { TooltipContentProps } from '@radix-ui/react-tooltip'
import { ArchiveIcon, DeleteIcon, EditIcon, MenuIcon } from 'lucide-react'
import { FC } from 'react'

type ButtonWithTooltipProps = ButtonProps & {
  tooltip: string
  side?: TooltipContentProps['side']
}

const ButtonWithTooltip: FC<ButtonWithTooltipProps> = ({
  children,
  tooltip,
  side = 'top',
  ...rest
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button {...rest}>
            {children}
            <span className="sr-only">{tooltip}</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent side={side}>{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

const TopLeft: FC = () => {
  const isNewSelected = useThreadList(t => t.newThread === t.mainThreadId)
  return (
    <ThreadListPrimitive.New asChild>
      <ButtonWithTooltip
        variant="ghost"
        className={cn(
          'flex w-full justify-between px-3',
          isNewSelected && 'bg-aui-muted',
        )}
        tooltip="New Thread"
        side="right"
      >
        <div className="flex items-center gap-2 text-sm font-semibold">
          <span>New Thread</span>
        </div>

        <EditIcon className="size-4" />
      </ButtonWithTooltip>
    </ThreadListPrimitive.New>
  )
}

const ThreadListItem: FC = () => {
  return (
    <ThreadListItemPrimitive.Root className="hover:text-primary data-[active]:bg-muted data-[active]:text-primary flex items-center gap-2 rounded-lg px-3 py-2 transition-all">
      <ThreadListItemPrimitive.Trigger className="flex-grow text-start truncate">
        <ThreadListItemPrimitive.Title fallback="n/a" />
      </ThreadListItemPrimitive.Trigger>
      <ThreadListItemPrimitive.Archive asChild>
        <ButtonWithTooltip
          variant="ghost"
          className="hover:text-foreground/60 ml-auto h-auto p-0"
          tooltip="Archive"
        >
          <ArchiveIcon className="size-4" />
        </ButtonWithTooltip>
      </ThreadListItemPrimitive.Archive>
      <ThreadListItemPrimitive.Delete asChild>
        <ButtonWithTooltip
          variant="ghost"
          className="hover:text-foreground/60 ml-auto h-auto p-0"
          tooltip="Delete"
        >
          <DeleteIcon className="size-4" />
        </ButtonWithTooltip>
      </ThreadListItemPrimitive.Delete>
    </ThreadListItemPrimitive.Root>
  )
}

const MainLeft: FC = () => {
  return (
    <nav className="flex flex-col items-stretch gap-1 text-sm font-medium">
      <ThreadListPrimitive.Items components={{ ThreadListItem }} />
    </nav>
  )
}

const LeftBarSheet: FC = () => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="shrink-0 md:hidden">
          <MenuIcon className="size-4" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="flex flex-col">
        <div className="mt-6 flex flex-col gap-1">
          <TopLeft />
          <MainLeft />
        </div>
      </SheetContent>
    </Sheet>
  )
}

const Header: FC = () => {
  return (
    <header className="flex gap-2">
      <LeftBarSheet />
    </header>
  )
}

const Chat: FC = () => {
  const assistant: AssistantV2 = {
    _id: '67170abeb539c335ad24067a',
    name: 'Eve',
    image: 'app/assistant/eve_512.png',
    welcomeText: 'What do you want to create today?',
  }

  const sideStyle = 'bg-muted/40 px-3 py-2'
  const topStyle = 'border-b'
  const leftStyle = 'border-r hidden md:block'

  return (
    <div className="grid h-[calc(100dvh_-_64px)] w-full grid-flow-col grid-rows-[auto_1fr] md:grid-cols-[250px_1fr]">
      <div className={cn(sideStyle, leftStyle, topStyle)}>
        <TopLeft />
      </div>
      <div className={cn(sideStyle, leftStyle)}>
        <MainLeft />
      </div>
      <div className={cn(sideStyle, topStyle)}>
        <Header />
      </div>
      <div className="bg-background overflow-hidden">
        <Thread
          components={{
            ThreadWelcome: MyThreadWelcome,
          }}
          welcome={{
            suggestions: [
              {
                text: 'List of tools',
                prompt:
                  'Provide a short and concise list of all tools you have access to. Add a very brief description / use case for each.',
              },
              {
                text: 'Make a cat image',
                prompt: 'Make an image of a cute little cat with a hat',
              },
              {
                text: 'Animate my logo',
                prompt: 'Use the provided logo image to animate it',
              },
            ],
            message: assistant.welcomeText,
          }}
          assistantAvatar={{
            src: getCloudfrontOriginalUrl(assistant.image),
            fallback: assistant.name,
            alt: assistant.name,
          }}
          assistantMessage={{
            allowReload: false,
            allowSpeak: false,
            components: {
              Text: MarkdownText,
              ToolFallback,
            },
          }}
          userMessage={{
            allowEdit: false,
          }}
          branchPicker={{
            allowBranchPicker: false,
          }}
          composer={{
            allowAttachments: true,
          }}
          tools={[TaskResultTool]}
        />
      </div>
    </div>
  )
}

export default Chat
