import { Button } from '../ui/button'
import { Card } from '@/components/ui/card'
import { AuthClickGuard } from '@/features/chat/components/auth-click-guard'
import { useAuthState } from '@/hooks/use-auth-state'
import { cn } from '@/lib/utils'
import { ChevronRightIcon, PlusCircle } from 'lucide-react'
import Link from 'next/link'

interface CreateAgentCardProps {
  className?: string
}

export function CreateAgentCard({ className }: CreateAgentCardProps) {
  const { user } = useAuthState()

  return (
    <Card
      className={cn([
        'relative overflow-hidden border-0 z-10 transition-shadow group bg-secondary hover:ring-2 ring-purple-600/40',
        className,
      ])}
    >
      <AuthClickGuard>
        <Link
          href={`/creators/${user?.username}?tab=agents&create=true`}
          className="relative w-full block p-2"
        >
          <div className="relative flex">
            <div className="bg-muted-darker rounded-lg aspect-square h-[140px] flex-shrink-0 flex-grow-0 flex items-center justify-center border-2 border-purple-600/40">
              <PlusCircle className="h-10 w-10 text-purple-600/60" />
            </div>
            <div className="ml-3 flex flex-col w-full">
              <span className="font-semibold mr-auto">
                Create your own agent
              </span>
              <div className="text-xs text-accent-foreground line-clamp-3 mt-2">
                Create and deploy your own custom agent with unique personality
                and capabilities
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-auto justify-end group-hover:text-white hover:text-white transition-all">
                <Button size="sm" variant="ghost">
                  Get started now
                  <ChevronRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </Link>
      </AuthClickGuard>
    </Card>
  )
}
