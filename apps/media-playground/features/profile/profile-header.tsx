'use client'

import TwitterIcon from '@/components/icons/twitter'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useCreatorQuery } from '@/hooks/query/use-creator-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { Creator } from '@edenlabs/eden-sdk'
import { InstagramLogoIcon } from '@radix-ui/react-icons'
import { ImageIcon, LinkIcon, UserIcon } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

// Extended Creator type with optional count fields from API
type CreatorWithCounts = Creator & {
  creationsCount?: number
}

type Props = {
  name: string
  creatorSSRData: Creator
}

const ProfileHeader = ({ name, creatorSSRData }: Props) => {
  const router = useRouter()
  const { user } = useAuthState()
  const { creator: creatorClientData } = useCreatorQuery({
    key: name,
    initialData: {
      creator: creatorSSRData,
    },
  })

  const creator = creatorClientData || creatorSSRData

  const onConnectSocials = () => {
    router.push(`/settings/connections`)
  }

  return (
    <div className="px-4 py-4 sm:p-6">
      <div className="flex gap-4 sm:gap-6">
        {/* Avatar - matches agent page sizing */}
        <div className="relative h-28 w-28 sm:h-40 sm:w-40 rounded-xl sm:rounded-2xl flex-shrink-0 overflow-hidden ring-1 ring-border/50 shadow-lg">
          <Image
            src={creator.userImage || ''}
            alt={creator.username || ''}
            fill
            className="object-cover"
          />
        </div>

        {/* Info */}
        <div className="flex flex-col flex-1 min-w-0 justify-center">
          {/* Name */}
          <h1 className="text-xl sm:text-3xl md:text-4xl font-semibold tracking-tight truncate">
            {name}
          </h1>

          {/* Meta Row: all stats inline with dots */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 sm:mt-4 text-xs sm:text-sm text-muted-foreground">
            {user?._id === creator?._id && (
              <>
                <Badge variant="outline" className="text-xs">
                  My profile
                </Badge>
                <span className="text-muted-foreground/40">·</span>
              </>
            )}
            <div className="flex items-center gap-1">
              <UserIcon className="w-3 h-3" />
              <span>
                Member since {new Date(creator.createdAt).getFullYear()}
              </span>
            </div>
            {(creator as CreatorWithCounts).creationsCount &&
              (creator as CreatorWithCounts).creationsCount! > 0 && (
                <>
                  <span className="text-muted-foreground/40">·</span>
                  <div className="flex items-center gap-1">
                    <ImageIcon className="w-3 h-3" />
                    <span>
                      {(
                        creator as CreatorWithCounts
                      ).creationsCount!.toLocaleString()}{' '}
                      creations
                    </span>
                  </div>
                </>
              )}
            {/* Social badges inline */}
            {creator.twitterHandle && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 cursor-pointer hover:brightness-125"
                  onClick={() =>
                    window.open(
                      `https://x.com/${creator.twitterHandle}`,
                      '_blank',
                    )
                  }
                >
                  <TwitterIcon size={12} />@{creator.twitterHandle}
                </Badge>
              </>
            )}
            {creator.instagramHandle && (
              <>
                <span className="text-muted-foreground/40">·</span>
                <Badge
                  variant="secondary"
                  className="flex items-center gap-1 cursor-pointer hover:brightness-125"
                  onClick={() =>
                    window.open(
                      `https://www.instagram.com/${creator.instagramHandle}`,
                      '_blank',
                    )
                  }
                >
                  <InstagramLogoIcon className="size-3" />@
                  {creator.instagramHandle}
                </Badge>
              </>
            )}
          </div>

          {/* Action button - Connect Socials (only for own profile, desktop only) */}
          {user?._id === creator?._id && (
            <div className="hidden sm:flex flex-wrap items-center gap-2 mt-4">
              <Button
                variant="outline"
                size="default"
                className="flex items-center gap-2"
                onClick={onConnectSocials}
              >
                <LinkIcon className="w-4 h-4" />
                Connect Your Socials
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfileHeader
