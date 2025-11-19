import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { Agent } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const formSchema = z.object({
  owner_pays: z
    .union([
      z.literal('off'),
      z.literal('deployments'),
      z.literal('full'),
      z.boolean(), // backward compatibility
    ])
    .default('off'),
})

type FormValues = z.infer<typeof formSchema>

interface AgentDeploymentSettingsProps {
  agent: Agent
}

export const AgentDeploymentSettings = ({
  agent,
}: AgentDeploymentSettingsProps) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      owner_pays:
        typeof agent.owner_pays === 'boolean'
          ? agent.owner_pays
            ? 'full'
            : 'off'
          : agent.owner_pays || 'off',
    },
  })

  const onSubmit = async (data: FormValues) => {
    try {
      await axios.patch(`/api/agents/${agent._id}`, {
        owner_pays: data.owner_pays,
      })
      toast.success('Integration settings updated successfully', {
        description: 'Your changes have been saved.',
        richColors: true,
        dismissible: true,
      })
    } catch (error) {
      toast.error('Failed to update integration settings', {
        description: 'Please try again later.',
        richColors: true,
        dismissible: true,
      })
    }
  }

  return (
    <div className="mt-8 space-y-4 rounded-lg">
      <h2 className="text-lg font-medium">Integration Settings</h2>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="owner_pays"
            render={({ field }) => (
              <FormItem className="bg-background border p-4 rounded-lg">
                <div className="flex flex-col gap-3">
                  <FormLabel>Cover Usage Costs</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <ToggleGroup
                        type="single"
                        value={
                          typeof field.value === 'boolean'
                            ? field.value
                              ? 'full'
                              : 'off'
                            : field.value
                        }
                        onValueChange={field.onChange}
                        className="flex flex-col items-stretch gap-2"
                      >
                        <ToggleGroupItem
                          value="off"
                          className="flex flex-col items-start justify-start h-auto p-2.5 border border-border/50 rounded-md data-[state=on]:bg-primary/20 data-[state=on]:border-primary data-[state=on]:text-primary-foreground hover:bg-accent/50 transition-colors text-left"
                        >
                          <div className="font-medium text-sm">Off</div>
                          <div className="text-xs text-muted-foreground data-[state=on]:text-primary-foreground/80 mt-0.5">
                            Users pay for their own usage.
                          </div>
                        </ToggleGroupItem>
                        <ToggleGroupItem
                          value="deployments"
                          className="flex flex-col items-start justify-start h-auto p-2.5 border border-border/50 rounded-md data-[state=on]:bg-primary/20 data-[state=on]:border-primary data-[state=on]:text-primary-foreground hover:bg-accent/50 transition-colors text-left"
                        >
                          <div className="font-medium text-sm">
                            Deployments only
                          </div>
                          <div className="text-xs text-muted-foreground data-[state=on]:text-primary-foreground/80 mt-0.5">
                            Agent owner covers all usage costs on social
                            platforms and deployments only.
                          </div>
                        </ToggleGroupItem>
                        <ToggleGroupItem
                          value="full"
                          className="flex flex-col items-start justify-start h-auto p-2.5 border border-border/50 rounded-md data-[state=on]:bg-primary/20 data-[state=on]:border-primary data-[state=on]:text-primary-foreground hover:bg-accent/50 transition-colors text-left"
                        >
                          <div className="font-medium text-sm">Full</div>
                          <div className="text-xs text-muted-foreground data-[state=on]:text-primary-foreground/80 mt-0.5">
                            Agent owner covers all costs, including the main
                            Eden app.
                          </div>
                        </ToggleGroupItem>
                      </ToggleGroup>
                    </div>
                  </FormControl>
                </div>
              </FormItem>
            )}
          />

          <div className="flex justify-end">
            <Button type="submit" disabled={form.formState.isSubmitting}>
              Save
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
