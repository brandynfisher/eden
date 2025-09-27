'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { Concept2, UserConceptsListResponse } from '@edenlabs/eden-sdk'
import axios from 'axios'
import { ImageIcon, Plus } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

const ConceptsListView = () => {
  const [concepts, setConcepts] = useState<Concept2[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConcepts()
  }, [])

  const fetchConcepts = async () => {
    try {
      const response = await axios.get<UserConceptsListResponse>(
        '/api/v2/concepts',
      )
      // Filter out deleted concepts
      const activeConcepts = (response.data.concepts || []).filter(
        concept => !concept.deleted,
      )
      setConcepts(activeConcepts)
    } catch (error) {
      toast.error('Failed to load concepts')
      console.error('Error fetching concepts:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto max-w-6xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">My Concepts</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-32 bg-muted rounded mb-4"></div>
                <div className="h-3 bg-muted rounded w-full mb-2"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto max-w-6xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Concepts</h1>
          <p className="text-muted-foreground">
            Manage your concepts and their training images
          </p>
        </div>
        <Link href="/concepts/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Concept
          </Button>
        </Link>
      </div>

      {concepts.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No concepts yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first concept to get started
            </p>
            <Link href="/concepts/new">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Concept
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {concepts.map(concept => (
            <ConceptCard key={concept._id} concept={concept} />
          ))}
        </div>
      )}
    </div>
  )
}

const ConceptCard = ({ concept }: { concept: Concept2 }) => {
  const firstImage = concept.images?.[0]
  const imageCount = concept.images?.length || 0
  const triggerPromptPreview = concept.usage_instructions
    ? concept.usage_instructions.slice(0, 50) +
      (concept.usage_instructions.length > 50 ? '...' : '')
    : 'No trigger prompt provided'

  // Type guard to check if agent is populated with full object
  interface PopulatedAgent {
    userImage?: string
    username?: string
  }
  const agentData =
    concept.agent &&
    typeof concept.agent === 'object' &&
    'userImage' in concept.agent
      ? (concept.agent as PopulatedAgent)
      : null

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow relative">
      {/* Agent thumbnail */}
      {agentData?.userImage && (
        <div className="absolute top-3 right-3 z-10">
          <Link href={`/chat/${agentData.username}`} className="block">
            <div className="w-11 h-11 rounded-full overflow-hidden bg-background border-2 border-background shadow-sm hover:shadow-md transition-shadow">
              <Image
                src={getCloudfrontOriginalUrl(agentData.userImage)}
                alt="Agent"
                width={44}
                height={44}
                className="object-cover"
                unoptimized
              />
            </div>
          </Link>
        </div>
      )}

      <Link href={`/concepts/${concept._id}/edit`} className="block">
        <div className="cursor-pointer">
          <CardHeader>
            <CardTitle className="line-clamp-1">{concept.name}</CardTitle>
            <CardDescription className="line-clamp-2">
              {triggerPromptPreview}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {firstImage ? (
              <div className="aspect-square relative mb-4 rounded-lg overflow-hidden bg-muted">
                <Image
                  src={firstImage.image}
                  alt={concept.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="aspect-square mb-4 rounded-lg bg-muted flex items-center justify-center">
                <ImageIcon className="w-8 h-8 text-muted-foreground" />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>
                  {imageCount} {imageCount === 1 ? 'image' : 'images'}
                </span>
              </div>
            </div>
          </CardContent>
        </div>
      </Link>
    </Card>
  )
}

export default ConceptsListView
