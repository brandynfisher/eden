'use client'

import ModelMiniCard from '@/components/card/model-mini-card'
import ModelSelectorModal from '@/components/modal/model-selector-modal'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AutosizeTextarea } from '@/components/ui/custom/autoresize-textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { VoiceSelector } from '@/components/ui/voice-selector/voice-selector'
import { agentSchema } from '@/features/agent/agent-form-sheet'
import { GatedResource, useGatedResource } from '@/hooks/use-gated-resource'
import { Lock, Plus, XIcon } from 'lucide-react'
import Link from 'next/link'
import { FC, useState } from 'react'
import { UseFormReturn, useFieldArray } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

type AgentFormDto = z.infer<typeof agentSchema>

interface ToolsTabProps {
  form: UseFormReturn<AgentFormDto>
  hasDeployments: boolean
  user?: { featureFlags?: string[] }
  agent?: { _id?: string; owner?: string | { _id: string } }
}

export const ToolsTab: FC<ToolsTabProps> = ({ form, hasDeployments, user }) => {
  const hasReasoningFeature = user?.featureFlags?.includes('reasoning') || false
  const [showGigabrainGateDialog, setShowGigabrainGateDialog] = useState(false)

  // show reasoning option if user has reasoning feature flag
  // true / false controls if to show to user who doesn't have flag
  const showReasoningOption = hasReasoningFeature // make invisible for now

  const { isAllowed: isGigabrainAllowed } = useGatedResource(
    GatedResource.GigabrainTools,
  )

  const models = useFieldArray({
    control: form.control,
    name: 'models',
  })

  return (
    <div className="space-y-6">
      <div>
        {/* Tools Field */}
        <FormField
          control={form.control}
          name="tools"
          render={({ field }) => (
            <FormItem className="rounded-xl border border-border bg-card p-6 space-y-4">
              <FormLabel>Tools</FormLabel>
              <FormDescription>
                Select which tools this agent can use to help users.
              </FormDescription>
              <FormControl>
                <div className="space-y-3">
                  {[
                    {
                      key: 'create_image',
                      label: 'Create images and videos',
                    },
                    {
                      key: 'create_audio',
                      label: 'Create Audio (including music and speech)',
                    },
                    {
                      key: 'vj_tools',
                      label: 'VJ Tools (Texture Flow and Video FX)',
                    },
                    {
                      key: 'manage_collections',
                      label: 'Manage collections',
                    },
                    ...(hasDeployments
                      ? [
                          {
                            key: 'social_media_tools',
                            label:
                              'Integration tools (social platforms & utilities)',
                          },
                        ]
                      : []),
                    {
                      key: 'legacy_tools',
                      label: 'Legacy tools',
                      description: '2023 Eden tools',
                    },
                    {
                      key: 'gigabrain_tools',
                      label: 'Gigabrain tools',
                      description:
                        'Profile matching and collective kickstart tools',
                      requiresProSubscription: true,
                    },
                  ].map(tool => {
                    const isGated =
                      tool.requiresProSubscription && !isGigabrainAllowed
                    return (
                      <div
                        key={tool.key}
                        className="flex items-center space-x-2"
                      >
                        <Switch
                          checked={Boolean(field.value?.[tool.key])}
                          onCheckedChange={checked => {
                            if (isGated && checked) {
                              setShowGigabrainGateDialog(true)
                              return
                            }
                            const currentTools = field.value || {}
                            field.onChange({
                              ...currentTools,
                              [tool.key]: checked,
                            })
                          }}
                        />
                        <div className="flex flex-col">
                          <label className="text-sm font-medium flex items-center gap-2">
                            {tool.label}
                            {isGated && <Lock className="h-3 w-3" />}
                          </label>
                          {tool.description && (
                            <span className="text-xs text-muted-foreground">
                              {tool.description}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* LLM Preferences */}
        {showReasoningOption && (
          <div className="rounded-xl border border-border bg-card p-6 space-y-6">
            <div className="mb-6">
              <h3 className="text-base font-medium">LLM Preference</h3>
              {/* <p className="text-sm text-muted-foreground">
                Configure reasoning and thinking behavior for this agent.
              </p> */}
            </div>

            <div className="space-y-6">
              <FormField
                control={form.control}
                name="llm_settings.model_profile"
                render={({ field }) => (
                  <FormItem>
                    {/* <FormLabel className="text-sm font-medium mb-3 block">Model Profile</FormLabel> */}
                    <FormControl>
                      <div className="space-y-3">
                        {/* Efficient Option */}
                        <div
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            field.value === 'low' || !field.value
                              ? 'border-primary bg-card text-foreground'
                              : 'border-muted bg-muted/50 text-muted-foreground hover:border-muted-foreground/50'
                          }`}
                          onClick={() => field.onChange('low')}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="text-sm font-medium">
                                  Efficient
                                </div>
                                <Badge variant="secondary" className="text-xs">
                                  Fastest
                                </Badge>
                              </div>
                              <p className="text-xs opacity-70">
                                Fastest & cheapest. Best for: chat, simple Q&A,
                                single tool workflows.
                              </p>
                            </div>
                            <div className="ml-3">
                              <div
                                className={`w-4 h-4 rounded-full border-2 ${
                                  field.value === 'low' || !field.value
                                    ? 'border-primary bg-primary'
                                    : 'border-muted-foreground/50'
                                }`}
                              >
                                {(field.value === 'low' || !field.value) && (
                                  <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Balanced Option */}
                        <div
                          className={`p-4 border rounded-lg cursor-pointer transition-all ${
                            field.value === 'medium'
                              ? 'border-primary bg-card text-foreground'
                              : 'border-muted bg-muted/50 text-muted-foreground hover:border-muted-foreground/50'
                          }`}
                          onClick={() => field.onChange('medium')}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="text-sm font-medium">
                                  Balanced
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  Recommended
                                </Badge>
                              </div>
                              <p className="text-xs opacity-70">
                                Good balance of speed and smarts. Best for:
                                general purpose, creative tasks, multi-step
                                workflows.
                              </p>
                            </div>
                            <div className="ml-3">
                              <div
                                className={`w-4 h-4 rounded-full border-2 ${
                                  field.value === 'medium'
                                    ? 'border-primary bg-primary'
                                    : 'border-muted-foreground/50'
                                }`}
                              >
                                {field.value === 'medium' && (
                                  <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Deep Reasoning Option */}
                        {showReasoningOption && (
                          <div
                            className={`p-4 border rounded-lg transition-all ${
                              !hasReasoningFeature
                                ? 'border-muted bg-muted/30 cursor-not-allowed opacity-50'
                                : field.value === 'high'
                                ? 'border-primary bg-card text-foreground cursor-pointer'
                                : 'border-muted bg-muted/50 text-muted-foreground hover:border-muted-foreground/50 cursor-pointer'
                            }`}
                            onClick={() =>
                              hasReasoningFeature && field.onChange('high')
                            }
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="text-sm font-medium flex items-center gap-2">
                                    Deep Reasoning
                                    {!hasReasoningFeature && (
                                      <Lock className="h-3 w-3" />
                                    )}
                                  </div>
                                  <Badge
                                    className={`text-xs ${
                                      hasReasoningFeature
                                        ? 'bg-green-600 hover:bg-green-700 text-white border-green-600'
                                        : 'bg-red-600 hover:bg-red-700 text-white border-red-600'
                                    }`}
                                  >
                                    Premium
                                  </Badge>
                                </div>
                                <p className="text-xs opacity-70">
                                  {!hasReasoningFeature
                                    ? 'Premium feature - contact support for access.'
                                    : 'Advanced reasoning & thinking. Best for: analysis, problem solving, complex workflows.'}
                                </p>
                              </div>
                              <div className="ml-3">
                                <div
                                  className={`w-4 h-4 rounded-full border-2 ${
                                    field.value === 'high' &&
                                    hasReasoningFeature
                                      ? 'border-primary bg-primary'
                                      : 'border-muted-foreground/50'
                                  }`}
                                >
                                  {field.value === 'high' &&
                                    hasReasoningFeature && (
                                      <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                                    )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.watch('llm_settings.model_profile') === 'high' &&
                hasReasoningFeature && (
                  <>
                    <FormField
                      control={form.control}
                      name="llm_settings.thinking_policy"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium mb-3 block">
                            Thinking Intensity
                          </FormLabel>
                          <FormDescription className="mb-3">
                            When should the agent think?
                          </FormDescription>
                          <FormControl>
                            <ToggleGroup
                              type="single"
                              value={field.value || 'auto'}
                              onValueChange={value =>
                                value && field.onChange(value)
                              }
                              className="justify-start gap-2"
                            >
                              <ToggleGroupItem
                                value="auto"
                                className="border border-muted data-[state=off]:border-muted data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary"
                              >
                                Auto
                              </ToggleGroupItem>
                              <ToggleGroupItem
                                value="off"
                                className="border border-muted data-[state=off]:border-muted data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary"
                              >
                                Off
                              </ToggleGroupItem>
                              <ToggleGroupItem
                                value="always"
                                className="border border-muted data-[state=off]:border-muted data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary"
                              >
                                Always
                              </ToggleGroupItem>
                            </ToggleGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {form.watch('llm_settings.thinking_policy') === 'auto' && (
                      <FormField
                        control={form.control}
                        name="llm_settings.thinking_effort_instructions"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Reasoning Guidelines</FormLabel>
                            <FormDescription>
                              Guide your agent on when to choose low, medium, or
                              high thinking intensity.
                            </FormDescription>
                            <FormControl>
                              <AutosizeTextarea
                                placeholder="e.g., 'Use high reasoning for complex math questions, medium for drawing tasks, low for chit-chat'"
                                {...field}
                                className="min-h-[80px]"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {form.watch('llm_settings.thinking_policy') ===
                      'always' && (
                      <FormField
                        control={form.control}
                        name="llm_settings.thinking_effort_cap"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium mb-3 block">
                              Reasoning Effort Cap
                            </FormLabel>
                            <FormDescription className="mb-3">
                              Set the maximum reasoning intensity level.
                            </FormDescription>
                            <FormControl>
                              <ToggleGroup
                                type="single"
                                value={field.value || 'medium'}
                                onValueChange={value =>
                                  value && field.onChange(value)
                                }
                                className="justify-start gap-2"
                              >
                                <ToggleGroupItem
                                  value="low"
                                  className="border border-muted data-[state=off]:border-muted data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary"
                                >
                                  Low
                                </ToggleGroupItem>
                                <ToggleGroupItem
                                  value="medium"
                                  className="border border-muted data-[state=off]:border-muted data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary"
                                >
                                  Medium
                                </ToggleGroupItem>
                                <ToggleGroupItem
                                  value="high"
                                  className="border border-muted data-[state=off]:border-muted data-[state=on]:bg-primary data-[state=on]:text-primary-foreground data-[state=on]:border-primary"
                                >
                                  High
                                </ToggleGroupItem>
                              </ToggleGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </>
                )}
            </div>
          </div>
        )}

        {/* Voice Field */}
        <FormField
          control={form.control}
          name="voice"
          render={({ field }) => (
            <FormItem className="rounded-xl border border-border bg-card p-6 space-y-4">
              <FormLabel>Voice</FormLabel>
              <FormDescription>
                Your agent will speak with this voice.
              </FormDescription>
              <FormControl>
                <VoiceSelector
                  value={field.value || ''}
                  onChange={field.onChange}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Custom Models / LoRA Field */}
        <FormField
          control={form.control}
          name="models"
          render={() => (
            <FormItem className="rounded-xl border border-border bg-card p-6 space-y-4">
              <FormLabel>Custom Models</FormLabel>
              <FormDescription>
                Give your agent a unique aesthetic using up to 10 custom models.
              </FormDescription>
              <div>
                {models.fields.map((model, index) => (
                  <div
                    key={model.lora}
                    className="relative mb-4 p-4 bg-background rounded-lg border border-border/50 hover:border-primary/50 transition-colors"
                  >
                    <div className="space-y-4">
                      <div className="flex items-stretch gap-2 min-h-[82px]">
                        <div className="flex-grow">
                          <ModelMiniCard
                            className="w-full h-full"
                            modelId={model.lora}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          className="hover:bg-destructive hover:text-destructive-foreground h-auto"
                          size="icon"
                          onClick={() => models.remove(index)}
                        >
                          <XIcon className="size-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <FormField
                          control={form.control}
                          name={`models.${index}.use_when`}
                          render={({ field }) => (
                            <FormItem className="flex-1">
                              <FormLabel className="text-sm text-muted-foreground">
                                When to use this model
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder="e.g., 'when user asks for realistic images' or 'for anime style'"
                                  {...field}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                <div className="mt-4">
                  <ModelSelectorModal
                    className="p-4 md:p-8 w-full"
                    title="Select LoRA Model"
                    description="Pick a LoRA model to add to this agent"
                    currentValue=""
                    selectedIds={models.fields.map(m => m.lora)}
                    onChange={id => {
                      const modelId = typeof id === 'string' ? id : id[0]
                      if (!modelId) return

                      // Check if model already exists
                      if (models.fields.some(m => m.lora === modelId)) {
                        toast.error('This model is already added')
                        return
                      }

                      // Add new model
                      form.setValue('models', [
                        ...models.fields,
                        { lora: modelId, use_when: '' },
                      ])
                    }}
                    trigger={
                      <Button
                        type="button"
                        disabled={models.fields.length >= 10}
                        className="w-full"
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add LoRA Model
                      </Button>
                    }
                  />
                </div>
              </div>
            </FormItem>
          )}
        />
      </div>

      <Dialog
        open={showGigabrainGateDialog}
        onOpenChange={setShowGigabrainGateDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Pro+ Subscription Required</DialogTitle>
            <DialogDescription>
              Gigabrain tools are only available to Pro+ subscribers. Upgrade
              your subscription to unlock profile matching and collective
              kickstart tools.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowGigabrainGateDialog(false)}
            >
              Cancel
            </Button>
            <Button asChild>
              <Link href="/settings/subscription">View Subscription Plans</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
