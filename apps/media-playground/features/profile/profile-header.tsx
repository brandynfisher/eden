'use client'

import TwitterIcon from '@/components/icons/twitter'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import TypographyH3 from '@/components/ui/typography/TypographyH3'
import { useCreatorQuery } from '@/hooks/query/use-creator-query'
import { useAuthState } from '@/hooks/use-auth-state'
import { updateShareModal } from '@/stores/dialogs/dialogs.slice'
import { useAppDispatch } from '@/stores/store'
import { Creator } from '@edenlabs/eden-sdk'
import { InstagramLogoIcon } from '@radix-ui/react-icons'
import { LinkIcon, Share2Icon, UserIcon } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'

type Props = {
  name: string
  creatorSSRData: Creator
}

const ProfileHeader = ({ name, creatorSSRData }: Props) => {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { user } = useAuthState()
  const { creator: creatorClientData } = useCreatorQuery({
    key: name,
    initialData: {
      creator: creatorSSRData,
    },
  })

  const creator = creatorClientData || creatorSSRData

  const onShareProfile = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const shareUrl = `${baseUrl}/creators/${creator.username}`
    dispatch(
      updateShareModal({
        isOpen: true,
        shareUrl,
      }),
    )
  }

  const onConnectSocials = () => {
    router.push(`/settings/connections`)
  }

  return (
    <div className="flex flex-col gap-4 p-4 bg-muted-darker rounded-md">
      <div className="relative lg:flex lg:justify-between lg:gap-x-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative md:min-h-16 rounded-lg flex-shrink-0 overflow-hidden">
            <Image
              src={creator.userImage || ''}
              alt={creator.username || ''}
              width={128}
              height={128}
              className="object-cover rounded-lg"
            />
          </div>
          <div className="flex flex-col gap-4">
            <div>
              <TypographyH3 className="text-2xl font-semibold mb-2">
                {name}
              </TypographyH3>
              <div className="flex flex-wrap items-center gap-2">
                {user?._id === creator?._id ? (
                  <Badge variant={'outline'}>My profile</Badge>
                ) : null}
                <Badge variant="secondary" className="flex items-center gap-1">
                  <UserIcon className="w-3 h-3" />
                  Member since {new Date(creator.createdAt).getFullYear()}
                </Badge>
                {creator.twitterHandle && (
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
                )}
                {creator.instagramHandle && (
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
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {user?._id === creator?._id && (
                <Button
                  variant="outline"
                  size="default"
                  className="flex items-center gap-2"
                  onClick={onConnectSocials}
                >
                  <LinkIcon className="w-4 h-4" />
                  Connect Your Socials
                </Button>
              )}
              <Button
                variant="outline"
                size="default"
                className="flex items-center gap-2"
                onClick={onShareProfile}
              >
                <Share2Icon className="w-4 h-4" />
                Share
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileHeader
