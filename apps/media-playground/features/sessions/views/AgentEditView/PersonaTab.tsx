'use client'

import { AGENT_FIELD_LIMITS } from '../agent-constants'
import { Button } from '@/components/ui/button'
import { AutosizeTextarea } from '@/components/ui/custom/autoresize-textarea'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { agentSchema } from '@/features/agent/agent-form-sheet'
import { useMediaQuery } from '@/hooks/use-media-query'
import { FC, useEffect, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

type AgentFormDto = z.infer<typeof agentSchema>

function CharacterCount({ current, max }: { current: number; max: number }) {
  return (
    <div className="text-xs text-muted-foreground text-right">
      {current}/{max}
    </div>
  )
}

interface PersonaTabProps {
  form: UseFormReturn<AgentFormDto>
}

export const PersonaTab: FC<PersonaTabProps> = ({ form }) => {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [isPersonaFullEditorOpen, setIsPersonaFullEditorOpen] = useState(false)
  const personaValue = form.watch('persona') ?? ''
  const [personaDraft, setPersonaDraft] = useState(personaValue)

  useEffect(() => {
    setPersonaDraft(personaValue)
  }, [personaValue])

  return (
    <div className="space-y-8">
      <FormField
        control={form.control}
        name="persona"
        render={({ field }) => (
          <FormItem className="p-6 bg-card rounded-xl border border-border">
            <FormLabel className="text-base font-medium">
              Persona
              <span className="text-red-500 ml-1">*</span>
            </FormLabel>
            <FormDescription className="mt-1 mb-3">
              Instructions about your agent&apos;s behavior, personality,
              writing style, backstory, and any important rules to follow.
            </FormDescription>
            <FormControl>
              <AutosizeTextarea
                placeholder="Describe your agent's persona, traits, goals, backstory, rules, and other such details."
                {...field}
                className="min-h-[240px]"
                variant="xl"
                readOnly={isMobile}
                onFocus={event => {
                  if (isMobile) {
                    event.preventDefault()
                    event.target.blur()
                    setIsPersonaFullEditorOpen(true)
                  }
                }}
                onClick={event => {
                  if (isMobile) {
                    event.preventDefault()
                    setIsPersonaFullEditorOpen(true)
                  }
                }}
              />
            </FormControl>
            {isMobile && (
              <p className="text-xs text-muted-foreground mt-2">
                Tap to open the full-screen editor for easier typing.
              </p>
            )}
            <div className="flex justify-end mt-2">
              <CharacterCount
                current={field.value?.length || 0}
                max={AGENT_FIELD_LIMITS.INSTRUCTIONS_MAX_CHARS}
              />
            </div>
            {isMobile && (
              <Drawer
                open={isPersonaFullEditorOpen}
                onOpenChange={setIsPersonaFullEditorOpen}
              >
                <DrawerContent className="h-[90vh] rounded-t-3xl bg-background p-0 flex flex-col">
                  <DrawerHeader className="px-6 pt-6 pb-2 text-left">
                    <DrawerTitle>Persona</DrawerTitle>
                    <DrawerDescription>
                      Full-screen editor for easier writing on small screens.
                    </DrawerDescription>
                  </DrawerHeader>
                  <div className="flex-1 overflow-hidden">
                    <div className="h-full overflow-auto px-6 pb-4">
                      <AutosizeTextarea
                        value={personaDraft}
                        onChange={event => {
                          const nextValue = event.target.value
                          setPersonaDraft(nextValue)
                          form.setValue('persona', nextValue, {
                            shouldDirty: true,
                            shouldTouch: true,
                            shouldValidate: true,
                          })
                        }}
                        placeholder="Describe your agent's persona, traits, goals, backstory, rules, and other such details."
                        className="min-h-[55vh]"
                        variant="xl"
                        autoFocus
                      />
                      <div className="flex justify-end mt-2">
                        <CharacterCount
                          current={personaDraft.length}
                          max={AGENT_FIELD_LIMITS.INSTRUCTIONS_MAX_CHARS}
                        />
                      </div>
                    </div>
                  </div>
                  <DrawerFooter className="border-t px-6 py-4">
                    <DrawerClose asChild>
                      <Button className="w-full">Done</Button>
                    </DrawerClose>
                  </DrawerFooter>
                </DrawerContent>
              </Drawer>
            )}
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
