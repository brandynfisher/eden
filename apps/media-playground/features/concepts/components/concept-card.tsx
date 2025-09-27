'use client'

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { getCloudfrontOriginalUrl } from '@/lib/media'
import { Concept2 } from '@edenlabs/eden-sdk'
import { ImageIcon } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface ConceptCardProps {
  concept: Concept2
  onClick?: () => void
  showAgent?: boolean
}

const ConceptCard = ({
  concept,
  onClick,
  showAgent = true,
}: ConceptCardProps) => {
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

  const cardContent = (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow relative">
      {/* Agent thumbnail */}
      {showAgent && agentData?.userImage && (
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
    </Card>
  )

  if (onClick) {
    return <div onClick={onClick}>{cardContent}</div>
  }

  return (
    <Link href={`/concepts/${concept._id}/edit`} className="block">
      {cardContent}
    </Link>
  )
}

export default ConceptCard
