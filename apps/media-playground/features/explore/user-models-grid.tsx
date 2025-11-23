'use client'

// import { useAuthState } from '@/hooks/use-auth-state'
import ModelMiniCard from '@/components/card/model-mini-card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import TypographyH4 from '@/components/ui/typography/TypographyH4'
import { useModelsListQuery } from '@/hooks/query/use-models-list-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { ChevronRight, LogIn, PlusIcon } from 'lucide-react'
import Link from 'next/link'
import React, { useMemo } from 'react'

export default function UserModelsGrid() {
  const { user, verifyAuth, isLoading: isAuthLoading = false } = useAuthState()

  const queryOptions = useMemo(
    () => ({
      enabled: !!user?._id,
      user: user?._id,
      limit: 5,
    }),
    [user?._id],
  )

  const { models, isLoading } = useModelsListQuery(queryOptions)

  // Show loading state while auth is being determined
  const isLoadingState = isAuthLoading || isLoading

  // If auth check is complete and user is not logged in, show auth prompt
  const showAuthPrompt = !isAuthLoading && !user

  return (
    <div className="mb-12">
      <div className="flex items-center mb-6 gap-x-2 mt-4 h-9">
        <div className="flex items-center justify-between">
          <TypographyH4 className="text-xl font-semibold text-center">
            My Models
          </TypographyH4>
        </div>
        {user && (
          <Button
            asChild
            size="sm"
            variant="outline"
            className="ml-auto gap-x-2 text-sm font-medium border-gray-700 hover:bg-gray-800"
          >
            <Link
              href={`/creators/${user?.username}?tab=models`}
              prefetch={false}
            >
              More
              <ChevronRight className="w-4 h-4" />
            </Link>
          </Button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {isLoadingState ? (
          <>
            <Skeleton className="w-full h-[82px]" />
            <Skeleton className="w-full h-[82px]" />
            <Skeleton className="w-full h-[82px]" />
            <Skeleton className="w-full h-[82px]" />
            <Skeleton className="w-full h-[82px]" />
          </>
        ) : showAuthPrompt ? (
          <div
            onClick={verifyAuth}
            className="col-span-full flex flex-col items-center justify-center p-6 text-center bg-muted/20 border border-dashed border-gray-700 rounded-md cursor-pointer transition-all hover:bg-gray-800/30 hover:border-gray-600"
          >
            <p className="text-muted-foreground mb-3">
              Sign in to view your models
            </p>
            <Button variant="outline" className="gap-x-2">
              <LogIn className="w-4 h-4" />
              Sign In
            </Button>
          </div>
        ) : (
          models?.map(model => (
            <ModelMiniCard
              key={model._id}
              modelId={model._id}
              showCreator={false}
            />
          ))
        )}
      </div>
      <Button
        asChild
        variant="outline"
        className={`mt-4 gap-x-2 text-sm font-semibold bg-purple-600/40 hover:bg-purple-600/20 border-purple-600/60 hover:border-purple-600 ${
          !user && !isAuthLoading ? 'opacity-0 pointer-events-none' : ''
        }`}
      >
        <Link href="/studio/lora/flux_trainer" prefetch={false}>
          <PlusIcon className="w-4 h-4" />
          Train Model
        </Link>
      </Button>
    </div>
  )
}
