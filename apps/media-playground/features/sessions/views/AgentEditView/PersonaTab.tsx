'use client'

import {
  SUBSCRIPTION_TIER_NAMES,
  formatCharacterCount,
  getPersonaCharacterLimit,
} from '../agent-constants'
import { Button } from '@/components/ui/button'
import { AutosizeTextarea } from '@/components/ui/custom/autoresize-textarea'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { agentSchema } from '@/features/agent/agent-form-sheet'
import { useAuthState } from '@/hooks/use-auth-state'
import { useMediaQuery } from '@/hooks/use-media-query'
import { openUserSettingsModal } from '@/lib/user-settings'
import { cn } from '@/lib/utils'
import { SubscriptionTier } from '@edenlabs/eden-sdk'
import { AlertTriangleIcon, CrownIcon } from 'lucide-react'
import { FC, useEffect, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { z } from 'zod'

type AgentFormDto = z.infer<typeof agentSchema>

interface CharacterCountProps {
  current: number
  max: number
  isOverLimit?: boolean
  isNearLimit?: boolean
  onClick?: () => void
}

function CharacterCount({
  current,
  max,
  isOverLimit,
  isNearLimit,
  onClick,
}: CharacterCountProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={cn(
              'text-xs tabular-nums text-right cursor-pointer select-none',
              isOverLimit && 'text-red-500 font-medium',
              isNearLimit && !isOverLimit && 'text-orange-400',
              !isNearLimit && !isOverLimit && 'text-muted-foreground',
            )}
            onClick={onClick}
          >
            {formatCharacterCount(current)}/{formatCharacterCount(max)}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          {isOverLimit ? (
            <p>
              Upgrade your{' '}
              <button
                className="text-purple-400 underline hover:text-purple-300"
                onClick={() => openUserSettingsModal('subscription')}
              >
                subscription
              </button>{' '}
              to increase persona limits
            </p>
          ) : (
            <p>{formatCharacterCount(max - current)} characters remaining</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

interface PersonaTabProps {
  form: UseFormReturn<AgentFormDto>
}

// Get next tier info for upgrade prompt
const getNextTierInfo = (currentTier: SubscriptionTier) => {
  if (currentTier >= SubscriptionTier.Believer) {
    return null // Already at max tier (excluding Admin)
  }
  const nextTier = (currentTier + 1) as SubscriptionTier
  return {
    name: SUBSCRIPTION_TIER_NAMES[nextTier],
    limit: getPersonaCharacterLimit(nextTier),
  }
}

export const PersonaTab: FC<PersonaTabProps> = ({ form }) => {
  const isMobile = useMediaQuery('(max-width: 768px)')
  const [isPersonaFullEditorOpen, setIsPersonaFullEditorOpen] = useState(false)
  const [showCharacterLimitModal, setShowCharacterLimitModal] = useState(false)
  const personaValue = form.watch('persona') ?? ''
  const [personaDraft, setPersonaDraft] = useState(personaValue)

  // Get user subscription tier
  const { user } = useAuthState()
  const subscriptionTier = user?.subscriptionTier ?? SubscriptionTier.Free
  const characterLimit = getPersonaCharacterLimit(subscriptionTier)

  // Character limit state
  const characterCount = personaValue.length
  const isOverLimit = characterCount > characterLimit
  const isNearLimit = characterCount > characterLimit * 0.9

  const nextTierInfo = getNextTierInfo(subscriptionTier)

  useEffect(() => {
    setPersonaDraft(personaValue)
  }, [personaValue])

  const handleCharacterCountClick = () => {
    if (isOverLimit || isNearLimit) {
      openUserSettingsModal('subscription')
    }
  }

  return (
    <>
      {/* Character Limit Warning Modal */}
      <Dialog
        open={showCharacterLimitModal}
        onOpenChange={setShowCharacterLimitModal}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangleIcon className="text-orange-400 h-5 w-5" />
              Persona Too Long
            </DialogTitle>
            <DialogDescription asChild>
              <div className="flex flex-col gap-3 pt-4">
                <p>
                  Your persona has{' '}
                  <strong>{formatCharacterCount(characterCount)}</strong>{' '}
                  characters, which exceeds your limit of{' '}
                  <strong>{formatCharacterCount(characterLimit)}</strong>{' '}
                  characters.
                </p>
                <p className="text-muted-foreground">
                  Your current plan:{' '}
                  <strong className="capitalize">
                    {SUBSCRIPTION_TIER_NAMES[subscriptionTier]}
                  </strong>
                </p>
                {nextTierInfo && (
                  <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3 mt-2">
                    <div className="flex items-center gap-2 mb-2">
                      <CrownIcon className="text-purple-400 h-4 w-4" />
                      <span className="font-medium text-purple-300">
                        Upgrade to {nextTierInfo.name}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Get up to{' '}
                      <strong>
                        {formatCharacterCount(nextTierInfo.limit)}
                      </strong>{' '}
                      characters for your agent persona and unlock more
                      features.
                    </p>
                  </div>
                )}
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowCharacterLimitModal(false)}
            >
              Edit Persona
            </Button>
            {nextTierInfo && (
              <Button
                onClick={() => {
                  setShowCharacterLimitModal(false)
                  openUserSettingsModal('subscription')
                }}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <CrownIcon className="w-4 h-4 mr-2" />
                Upgrade Plan
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

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
                  className={cn(
                    'min-h-[240px]',
                    isOverLimit && 'border-red-500/50 focus:border-red-500',
                  )}
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
                  max={characterLimit}
                  isOverLimit={isOverLimit}
                  isNearLimit={isNearLimit}
                  onClick={handleCharacterCountClick}
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
                          className={cn(
                            'min-h-[55vh]',
                            personaDraft.length > characterLimit &&
                              'border-red-500/50 focus:border-red-500',
                          )}
                          variant="xl"
                          autoFocus
                        />
                        <div className="flex justify-end mt-2">
                          <CharacterCount
                            current={personaDraft.length}
                            max={characterLimit}
                            isOverLimit={personaDraft.length > characterLimit}
                            isNearLimit={
                              personaDraft.length > characterLimit * 0.9
                            }
                            onClick={handleCharacterCountClick}
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
    </>
  )
}
