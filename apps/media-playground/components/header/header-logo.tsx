import EdenLogoBw from '@/components/logo/eden-logo-bw'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface HeaderLogoProps {
  className?: string
  onClick?: () => void
  size?: string
}

const HeaderLogo = ({
  className,
  onClick,
  size = 'w-[32px]',
}: HeaderLogoProps) => {
  return (
    <Link
      href="/"
      className={cn('flex items-center gap-2 text-lg font-semibold', className)}
      onClick={onClick}
    >
      <EdenLogoBw className={size} />
      <span className="sr-only">Eden</span>
    </Link>
  )
}

export default HeaderLogo
