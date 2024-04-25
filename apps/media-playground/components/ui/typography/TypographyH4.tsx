import { HTMLProps, PropsWithChildren } from 'react'
import { cn } from '@/lib/utils'

const TypographyH4 = ({className, ...rest}:PropsWithChildren & HTMLProps<HTMLHeadingElement>) => {
  return (
    <h4
      className={cn('scroll-m-20 text-xl font-semibold tracking-tight', className)}
      {...rest}
    />
  )
}

export default TypographyH4