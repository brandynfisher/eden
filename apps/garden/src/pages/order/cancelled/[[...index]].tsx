import { withSessionSsr } from '@/lib/withSession'
import OrderSuccessPage from '@/pages/order/success/SuccessPage'
import { NextPageContext } from 'next'

import { Page } from '../../../../types/page'

interface PageProps {
  data: {
    customer: {
      name: string
    }
    session: {
      id: string
    }
  }
  error?: string
}

export const getOrderServerSidePropsBase = () => {
  const getServerSideProps = async (ctx: NextPageContext) => {
    const { query } = ctx

    try {
      const sessionId = query.session_id

      const session = {
        id: sessionId || null,
      }

      const customer = {
        name: 'test',
      }

      return { props: { data: { customer, session } } }
    } catch (err) {
      return { props: { data: null, error: 'Something went wrong' } }
    }
  }

  //@ts-ignore
  return withSessionSsr(getServerSideProps)
}

export const getServerSideProps = getOrderServerSidePropsBase()

const orderCancelled: Page<PageProps> = ({ data }: PageProps) => {
  return <OrderSuccessPage data={data} />
}

export default orderCancelled
