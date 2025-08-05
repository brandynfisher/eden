'use client'

import ModelMiniCard from '@/components/card/model-mini-card'
import ModelSelectorModal from '@/components/modal/model-selector-modal'
import { Button } from '@/components/ui/button'
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
import { VoiceSelector } from '@/components/ui/voice-selector/voice-selector'
import { agentSchema } from '@/features/agent/agent-form-sheet'
import { XIcon } from 'lucide-react'
import { FC } from 'react'
import { UseFormReturn, useFieldArray } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

type AgentFormDto = z.infer<typeof agentSchema>

interface ToolsTabProps {
  form: UseFormReturn<AgentFormDto>
  hasDeployments: boolean
}

export const ToolsTab: FC<ToolsTabProps> = ({ form, hasDeployments }) => {
  const models = useFieldArray({
    control: form.control,
    name: 'models',
  })

  return (
    <div className="space-y-6">
      <div>
        {/* Voice Field */}
        <FormField
          control={form.control}
          name="voice"
          render={({ field }) => (
            <FormItem className="p-4 bg-secondary rounded-lg mb-4">
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

        {/* Models Field */}
        <FormField
          control={form.control}
          name="models"
          render={() => (
            <FormItem className="p-4 bg-secondary rounded-lg">
              <FormLabel>Custom Models</FormLabel>
              <FormDescription>
                Give your agent a unique aesthetic using up to 10
                custom models.
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
                      const modelId =
                        typeof id === 'string' ? id : id[0]
                      if (!modelId) return

                      // Check if model already exists
                      if (
                        models.fields.some(
                          m => m.lora === modelId,
                        )
                      ) {
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
                        variant="outline"
                        disabled={models.fields.length >= 10}
                        className="w-full"
                      >
                        Add LoRA Model
                      </Button>
                    }
                  />
                </div>
              </div>
            </FormItem>
          )}
        />

        {/* Tools Field */}
        <FormField
          control={form.control}
          name="tools"
          render={({ field }) => (
            <FormItem className="p-4 bg-secondary rounded-lg mt-4">
              <FormLabel>Tools</FormLabel>
              <FormDescription>
                Select which tools this agent can use to help
                users.
              </FormDescription>
              <FormControl>
                <div className="space-y-3">
                  {[
                    {
                      key: 'create_image',
                      label: 'Create images',
                    },
                    {
                      key: 'create_video',
                      label: 'Create Video',
                    },
                    {
                      key: 'create_audio',
                      label:
                        'Create Audio (including music and speech)',
                    },
                    {
                      key: 'vj_tools',
                      label:
                        'VJ Tools (Texture Flow and Video FX)',
                    },
                    {
                      key: 'news',
                      label: 'Read the news',
                    },
                    ...(hasDeployments
                      ? [
                          {
                            key: 'social_media_tools',
                            label:
                              'Social media tools (read and post)',
                          },
                        ]
                      : []),
                    {
                      key: 'legacy_tools',
                      label: 'Legacy tools',
                      description: '2023 Eden tools',
                    },
                    {
                      key: 'all_tools',
                      label: 'All individual tools',
                      description:
                        'Make available individual tools inside the image, video, and audio multi-tools (50+ individual tools)',
                    },
                  ].map(tool => (
                    <div
                      key={tool.key}
                      className="flex items-center space-x-2"
                    >
                      <Switch
                        checked={Boolean(field.value?.[tool.key])}
                        onCheckedChange={checked => {
                          const currentTools = field.value || {}
                          field.onChange({
                            ...currentTools,
                            [tool.key]: checked,
                          })
                        }}
                      />
                      <div className="flex flex-col">
                        <label className="text-sm font-medium">
                          {tool.label}
                        </label>
                        {tool.description && (
                          <span className="text-xs text-muted-foreground">
                            {tool.description}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}