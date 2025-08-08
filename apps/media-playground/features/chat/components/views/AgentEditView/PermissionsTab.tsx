'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Agent } from '@edenlabs/eden-sdk'
import axios, { AxiosError } from 'axios'
import { Loader2, UserIcon, XIcon } from 'lucide-react'
import { FC, useState } from 'react'
import { toast } from 'sonner'

export const PermissionsTab: FC<{ agent: Agent }> = ({ agent }) => {
  const [editors, setEditors] = useState<string[]>(
    agent.agent_extras?.permissions?.editors?.map(
      e => e.username || e.userId,
    ) || [],
  )
  const [newEditor, setNewEditor] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddEditor = async () => {
    if (!newEditor.trim()) return

    const updatedEditors = [...editors, newEditor.trim()]
    setIsSubmitting(true)
    try {
      await axios.patch(`/api/agents/${agent._id}`, {
        agent_extras: {
          permissions: {
            editors: updatedEditors,
          },
        },
      })
      setEditors(updatedEditors)
      setNewEditor('')
      toast.success('Editor added successfully', {
        richColors: true,
        dismissible: true,
      })
    } catch (error) {
      const errorMessage =
        (error as AxiosError<{ error?: string }>).response?.data?.error ||
        (error as AxiosError).message ||
        'Failed to add editor'
      toast.error('Failed to add editor', {
        description: errorMessage,
        richColors: true,
        dismissible: true,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleRemoveEditor = async (editorToRemove: string) => {
    const updatedEditors = editors.filter(editor => editor !== editorToRemove)
    setIsSubmitting(true)
    try {
      await axios.patch(`/api/agents/${agent._id}`, {
        agent_extras: {
          permissions: {
            editors: updatedEditors,
          },
        },
      })
      setEditors(updatedEditors)
      toast.success('Editor removed successfully', {
        richColors: true,
        dismissible: true,
      })
    } catch (error) {
      toast.error('Failed to remove editor', {
        description: 'Please try again later.',
        richColors: true,
        dismissible: true,
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-medium mb-4">
          Agent Permissions
        </h2>
        <div className="p-6 bg-card rounded-xl border border-border">
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-2">
                Editors
              </label>
              <p className="text-sm text-muted-foreground mb-4">
                Users who can edit this agent (in addition to
                the owner)
              </p>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newEditor}
                    onChange={e => setNewEditor(e.target.value)}
                    placeholder="Enter Eden username..."
                    onKeyPress={e => {
                      if (e.key === 'Enter') {
                        handleAddEditor()
                      }
                    }}
                    disabled={isSubmitting}
                  />
                  <Button
                    onClick={handleAddEditor}
                    disabled={isSubmitting || !newEditor.trim()}
                    type="button"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      'Add Editor'
                    )}
                  </Button>
                </div>

                {editors.length > 0 && (
                  <div className="space-y-2">
                    {editors.map(editor => (
                      <div
                        key={editor}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <UserIcon className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{editor}</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveEditor(editor)}
                          disabled={isSubmitting}
                          className="hover:bg-destructive hover:text-destructive-foreground"
                        >
                          <XIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {editors.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No editors added yet. Add editors to allow other users to modify this
                    agent.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}