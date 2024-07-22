import { PropsWithChildren } from 'react'

type Props = PropsWithChildren & {
  params: {
    id: string
  }
}

const CreationDetailPageLayout = ({ children, params }: Props) => {
  return (
    <div>
      /creation - Detail Page Child Layout
      <div>id: {params.id}</div>
      <div>{children}</div>
    </div>
  )
}

export default CreationDetailPageLayout
