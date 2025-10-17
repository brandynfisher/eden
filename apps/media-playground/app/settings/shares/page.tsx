'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import TypographyH4 from '@/components/ui/typography/TypographyH4'
import { useAuthState } from '@/hooks/use-auth-state'
import { updateDeleteDialog } from '@/stores/dialogs/dialogs.slice'
import { useAppDispatch } from '@/stores/store'
import { SessionShare } from '@edenlabs/eden-sdk'
import { ExternalLink, Loader2, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

const SettingsSharesPage = () => {
  const { isSignedIn } = useAuthState()
  const dispatch = useAppDispatch()
  const [shares, setShares] = useState<SessionShare[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set())

  const fetchShares = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/v2/sessions/shares')
      const data = await response.json()
      if (data.shares) {
        setShares(data.shares)
      }
    } catch (error) {
      console.error('Failed to fetch shares:', error)
      toast.error('Failed to load shares')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isSignedIn) {
      fetchShares()
    }
  }, [isSignedIn])

  const handleDelete = (shareId: string, shareTitle?: string) => {
    dispatch(
      updateDeleteDialog({
        isOpen: true,
        title: 'Delete Share',
        description: `Are you sure you want to delete ${
          shareTitle ? `"${shareTitle}"` : 'this share'
        }? This will make the link no longer accessible to anyone.`,
        onDelete: async () => {
          setDeletingIds(prev => new Set(prev).add(shareId))

          try {
            const response = await fetch(`/api/v2/sessions/shares/${shareId}`, {
              method: 'DELETE',
            })

            if (!response.ok) {
              throw new Error('Failed to delete share')
            }

            toast.success('Share deleted successfully')
            setShares(shares.filter(share => share._id !== shareId))
          } catch (error) {
            console.error('Failed to delete share:', error)
            toast.error('Failed to delete share')
          } finally {
            setDeletingIds(prev => {
              const newSet = new Set(prev)
              newSet.delete(shareId)
              return newSet
            })
          }
        },
      }),
    )
  }

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  if (isLoading) {
    return (
      <>
        <TypographyH4>Session Shares</TypographyH4>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </>
    )
  }

  return (
    <>
      <TypographyH4>Session Shares</TypographyH4>
      <p className="text-sm text-muted-foreground mb-4">
        Manage your public session shares. These are conversations you&apos;ve
        shared with others.
      </p>

      <div className="space-y-4">
        {shares.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                You haven&apos;t created any shares yet.
              </p>
            </CardContent>
          </Card>
        ) : (
          shares.map(share => (
            <Card key={share._id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">
                      {share.title ||
                        share.session?.title ||
                        'Untitled Session'}
                    </CardTitle>
                    <CardDescription>
                      Created {formatDate(share.createdAt)}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Link
                      href={`/sessions/share/${share._id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() =>
                        handleDelete(
                          share._id,
                          share.title ||
                            share.session?.title ||
                            'Untitled Session',
                        )
                      }
                      disabled={deletingIds.has(share._id)}
                    >
                      {deletingIds.has(share._id) ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {share.session?.scenario && (
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {share.session.scenario}
                  </p>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </>
  )
}

export default SettingsSharesPage
