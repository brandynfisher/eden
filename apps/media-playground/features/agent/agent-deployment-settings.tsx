import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
} from '@/components/ui/form'
import { Switch } from '@/components/ui/switch'
import { Agent } from '@edenlabs/eden-sdk'
import { zodResolver } from '@hookform/resolvers/zod'
import axios from 'axios'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

const formSchema = z.object({
  owner_pays: z.boolean().default(false),
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
      owner_pays: agent.owner_pays,
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
              <FormItem className="bg-background border p-4 rounded-lg flex items-center justify-between gap-2">
                <div className="flex flex-col gap-2">
                  <FormLabel>Cover Usage Costs</FormLabel>
                  <FormDescription>
                    When enabled, you (the agent owner) will cover all usage
                    costs. When disabled, users will pay for their own usage.
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
