'use client'

import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { Deployment } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { AlertCircle, ChevronDown, Loader2 } from 'lucide-react'
import { FC, useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const captionsDeploymentSchema = z.object({
  enabled: z.boolean().default(false),
  api_key: z.string().min(1, 'API key is required'),
  workspace_id: z.string().min(1, 'Workspace ID is required'),
})

type CaptionsDeploymentFormDto = z.infer<typeof captionsDeploymentSchema>

interface CaptionsDeploymentFormProps {
  agentId: string
  deployment?: Deployment
}

export const CaptionsDeploymentForm: FC<CaptionsDeploymentFormProps> = ({
  agentId,
  deployment,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<CaptionsDeploymentFormDto>({
    resolver: zodResolver(captionsDeploymentSchema),
    defaultValues: {
      enabled: deployment?.enabled ?? false,
      api_key: deployment?.config?.api_key ?? '',
      workspace_id: deployment?.config?.workspace_id ?? '',
    },
  })

  const onSubmit = async (data: CaptionsDeploymentFormDto) => {
    setIsSubmitting(true)
    try {
      const payload = {
        platform: 'captions',
        enabled: data.enabled,
        config: {
          api_key: data.api_key,
          workspace_id: data.workspace_id,
        },
      }

      if (deployment?._id) {
        await axios.patch(`/api/deployments/${deployment._id}`, payload)
      } else {
        await axios.post(`/api/agents/${agentId}/deployments`, payload)
      }

      toast.success('Captions AI deployment updated successfully', {
        richColors: true,
        dismissible: true,
      })
    } catch (error) {
      toast.error('Failed to update Captions AI deployment', {
        description: 'Please try again later.',
        richColors: true,
        dismissible: true,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="rounded-lg border p-4 bg-secondary">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full"
      >
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-medium">Captions AI</h3>
          {deployment?.enabled && (
            <span className="text-xs bg-green-500 text-white px-2 py-1 rounded">
              Deployed
            </span>
          )}
        </div>
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform',
            isExpanded && 'rotate-180',
          )}
        />
      </button>

      {isExpanded && (
        <div className="mt-4">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Enable Deployment</FormLabel>
                      <FormDescription>
                        Allow your agent to generate AI-powered advertisement videos
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

              {form.watch('enabled') && (
                <>
                  <FormField
                    control={form.control}
                    name="api_key"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>API Key</FormLabel>
                        <FormControl>
                          <Input
                            type="password"
                            placeholder="Enter your Captions AI API key"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Your Captions AI API key. You can find this in your Captions account settings.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="workspace_id"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Workspace ID</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Enter your Captions workspace ID"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Your Captions workspace ID. You can find this in your Captions dashboard.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-start gap-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                    <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-500 mt-0.5" />
                    <div className="flex-1 text-sm text-yellow-700 dark:text-yellow-400">
                      <p>
                        Make sure your Captions AI account has the necessary API access and credits to generate videos.
                      </p>
                    </div>
                  </div>
                </>
              )}

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </Button>
            </form>
          </Form>
        </div>
      )}
    </div>
  )
}