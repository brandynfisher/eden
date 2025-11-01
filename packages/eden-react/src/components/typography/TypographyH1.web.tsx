import type { HTMLAttributes, PropsWithChildren } from 'react'

type HeadingProps = PropsWithChildren<HTMLAttributes<HTMLHeadingElement>>

const BASE_CLASSNAME =
  'scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl'

const joinClassNames = (...classes: Array<string | undefined>) =>
  classes.filter(Boolean).join(' ')

export const TypographyH1 = ({ className, ...rest }: HeadingProps) => {
  return (
    <h1 className={joinClassNames(BASE_CLASSNAME, className)} {...rest} />
  )
}
