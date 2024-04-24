import { PropsWithChildren } from 'react'

const TypographyH4 = ({...rest}: PropsWithChildren) => {
  return (
    <h4 className="scroll-m-20 text-xl font-semibold tracking-tight" {...rest} />
  )
}

export default TypographyH4