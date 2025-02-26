'use client'

// import { useAuthState } from '@/hooks/use-auth-state'
import ModelMiniCard from '@/components/card/model-mini-card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import TypographyH4 from '@/components/ui/typography/TypographyH4'
import { useModelsListQuery } from '@/hooks/query/use-models-list-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { ChevronRight, PlusIcon } from 'lucide-react'
import Link from 'next/link'
import React, { useMemo } from 'react'

export default function UserModelsGrid() {
  const { user } = useAuthState()

  const queryOptions = useMemo(
    () => ({
      enabled: !!user?._id,
      user: user?._id,
      limit: 5,
    }),
    [user?._id],
  )

  const { models, isLoading } = useModelsListQuery(queryOptions)

  if (!user) return null

  return (
    <div className="mb-12">
      <div className="flex items-center mb-6 gap-x-2 mt-4 h-9">
        <div className="flex items-center justify-between">
          <TypographyH4 className="text-xl font-semibold text-center">
            My Models
          </TypographyH4>
        </div>
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
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {isLoading ? (
          <>
            <Skeleton className="w-full h-[82px]" />
            <Skeleton className="w-full h-[82px]" />
            <Skeleton className="w-full h-[82px]" />
            <Skeleton className="w-full h-[82px]" />
            <Skeleton className="w-full h-[82px]" />
          </>
        ) : null}
        {models?.map(model => (
          <ModelMiniCard
            key={model._id}
            modelId={model._id}
            showCreator={false}
          />
        ))}
      </div>
      <Button
        asChild
        variant="outline"
        className="mt-4 gap-x-2 text-sm font-semibold bg-purple-600/40 hover:bg-purple-600/20 border-purple-600/60 hover:border-purple-600"
      >
        <Link href="/train" prefetch={false}>
          <PlusIcon className="w-4 h-4" />
          Train Model
        </Link>
      </Button>
    </div>
  )
}
