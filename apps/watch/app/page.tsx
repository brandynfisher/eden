import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { appConfig } from '@/config/app-config'
import { currentUser } from '@clerk/nextjs/server'
import { ArrowRight, Presentation } from 'lucide-react'
import Link from 'next/link'

export default async function WatchPage() {
  const user = await currentUser()

  if (!user) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="text-center">Welcome to Eden Watch</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4 text-muted-foreground">
              Please sign in to access your collections and start the slideshow.
            </p>
            <Link href="/sign-in">
              <Button>Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex px-4 sm:px-0 min-h-screen items-center justify-center">
      <Card className="w-full max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>How to start slideshow?</CardTitle>
          <CardDescription>
            Follow these steps to start your slideshow:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-8">
            <div className="flex items-start space-x-4">
              <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                1
              </div>
              <div className="w-full">
                <h3 className="font-semibold">Go to Your Collections</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Browse your collections on Eden.art
                </p>
                <Button variant="outline" asChild>
                  <Link
                    href={`${appConfig.edenAppUrl}/creators/${user.username}?tab=collections`}
                    target="_blank"
                  >
                    View Collections
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                2
              </div>
              <div className="w-full">
                <h3 className="font-semibold">Select a Collection</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Choose the collection you want to view in the slideshow
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex size-8 items-center justify-center rounded-md bg-muted">
                3
              </div>
              <div className="w-full">
                <h3 className="font-semibold">Start Slideshow</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  Click the slideshow button to start the slideshow
                </p>
                <Badge
                  variant="outline"
                  className="flex items-center gap-2 w-fit"
                >
                  <Presentation className="h-4 w-4" />
                  <span>
                    Look for the slideshow button on your collection page
                  </span>
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
