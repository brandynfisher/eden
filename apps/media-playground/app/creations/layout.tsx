import { PropsWithChildren } from 'react'

const CreationDetailPageBaseLayout = ({ children }: PropsWithChildren) => {
  return (
    <div>
      /creations - parent layout static
      <div>{children}</div>
    </div>
  )
}

export default CreationDetailPageBaseLayout
