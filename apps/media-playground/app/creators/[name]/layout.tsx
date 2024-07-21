import DefaultLayout from '@/components/layout/default-layout'
import TypographyH3 from '@/components/ui/typography/TypographyH3'
import { Creator } from '@edenlabs/eden-sdk'
import { PropsWithChildren } from 'react'

type Props = PropsWithChildren & {
  params: {
    name: Creator['username']
  }
}

const PageLayout = ({ children, params }: Props) => {
  const { name } = params

  return (
    <DefaultLayout>
      <TypographyH3>Creator: {name}</TypographyH3>

      {children}
    </DefaultLayout>
  )
}

export default PageLayout
