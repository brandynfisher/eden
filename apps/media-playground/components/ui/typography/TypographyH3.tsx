import { PropsWithChildren } from 'react'

const TypographyH3 = ({...rest}: PropsWithChildren) => {
  return (
    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight" {...rest} />
  )
}

export default TypographyH3