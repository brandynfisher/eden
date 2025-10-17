'use client'

import { ProfileImageUploader } from '../../profile-image-uploader'
import { AGENT_FIELD_GUIDANCE, AGENT_FIELD_LIMITS } from '../agent-constants'
import { Button } from '@/components/ui/button'
import { AutosizeTextarea } from '@/components/ui/custom/autoresize-textarea'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { SlickUsernamePicker } from '@/components/ui/slick-username-picker'
import { Switch } from '@/components/ui/switch'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { agentSchema } from '@/features/agent/agent-form-sheet'
import { Agent } from '@edenlabs/eden-sdk'
import { Copy } from 'lucide-react'
import { FC } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

type AgentFormDto = z.infer<typeof agentSchema>

function CharacterCount({ current, max }: { current: number; max: number }) {
  return (
    <div className="text-xs text-muted-foreground text-right">
      {current}/{max}
    </div>
  )
}

interface ProfileTabProps {
  form: UseFormReturn<AgentFormDto>
  agent: Agent
}

export const ProfileTab: FC<ProfileTabProps> = ({ form, agent }) => {
  const handleCopyId = () => {
    navigator.clipboard.writeText(agent._id)
    toast.success('Agent ID copied to clipboard')
  }

  return (
    <div className="space-y-8">
      <div>
        {/* Combined Profile Section */}
        <div className="p-6 bg-card rounded-xl border border-border mb-6 relative">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Profile Image */}
            <div className="flex-shrink-0">
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input
                        className={'hidden'}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        value={field.value === null ? '' : field.value || ''}
                      />
                    </FormControl>
                    <ProfileImageUploader
                      value={field.value}
                      onChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Username and Display Name */}
            <div className="flex-1 space-y-4">
              {/* Display Name Field */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">
                      Name
                      <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Display name"
                        {...field}
                        onChange={e => {
                          field.onChange(e.target.value.slice(0, 42))
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Username Field */}
              <FormField
                control={form.control}
                name="key"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-medium">
                      Username
                      <span className="text-red-500 ml-1">*</span>
                    </FormLabel>
                    <FormControl>
                      <SlickUsernamePicker
                        value={field.value}
                        onChange={field.onChange}
                        displayName={form.watch('name')}
                        onBlur={field.onBlur}
                        disabled={form.formState.isSubmitting}
                        originalValue={agent.username}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Agent ID Display */}
          <div className="absolute bottom-6 right-6 flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              ID: {agent._id}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleCopyId}
            >
              <Copy className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Public/Private Toggle Section */}
        <FormField
          control={form.control}
          name="public"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4 bg-card mb-6">
              <div className="space-y-0.5">
                <FormLabel className="text-base font-medium">
                  Make Agent Public
                </FormLabel>
                <FormDescription>
                  When public, other users can discover and interact with your
                  agent
                </FormDescription>
              </div>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Description Field */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem className="p-6 bg-card rounded-xl border border-border mb-6">
              <FormLabel className="text-base font-medium">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">
                        Description
                        <span className="text-red-500 ml-1">*</span>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        {AGENT_FIELD_GUIDANCE.DESCRIPTION}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </FormLabel>
              <FormControl>
                <AutosizeTextarea
                  placeholder="Short description of the agent shown on profile and cards."
                  {...field}
                  className="min-h-[80px]"
                />
              </FormControl>
              <div className="flex justify-end mt-2">
                <CharacterCount
                  current={field.value?.length || 0}
                  max={AGENT_FIELD_LIMITS.DESCRIPTION_MAX_CHARS}
                />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Persona Field */}
        <FormField
          control={form.control}
          name="persona"
          render={({ field }) => (
            <FormItem className="p-6 bg-card rounded-xl border border-border mb-6">
              <FormLabel className="text-base font-medium">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help">
                        Instructions
                        <span className="text-red-500 ml-1">*</span>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs whitespace-pre-wrap">
                        {AGENT_FIELD_GUIDANCE.INSTRUCTIONS}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </FormLabel>
              <FormControl>
                <AutosizeTextarea
                  placeholder="Describe your agent's persona, traits, goals, backstory, rules, and other such details."
                  {...field}
                  className="min-h-[240px]"
                  variant="xl"
                />
              </FormControl>
              <div className="flex justify-end mt-2">
                <CharacterCount
                  current={field.value?.length || 0}
                  max={AGENT_FIELD_LIMITS.INSTRUCTIONS_MAX_CHARS}
                />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Greeting Field */}
        <FormField
          control={form.control}
          name="greeting"
          render={({ field }) => (
            <FormItem className="p-6 bg-card rounded-xl border border-border mb-6">
              <FormLabel className="text-base font-medium">Greeting</FormLabel>
              <FormDescription className="mt-1 mb-3">
                This will be displayed to users when they first interact with
                the agent.
              </FormDescription>
              <FormControl>
                <AutosizeTextarea
                  placeholder="Hello, how can I help you today?"
                  {...field}
                  className="min-h-[60px]"
                />
              </FormControl>
              <div className="flex justify-end mt-2">
                <CharacterCount current={field.value?.length || 0} max={140} />
              </div>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
