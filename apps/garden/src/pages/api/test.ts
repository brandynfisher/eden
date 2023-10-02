import { withSessionRoute } from '@/lib/withSession'
import { NextApiRequest, NextApiResponse } from 'next'

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  console.log(process.env)
  return res.status(200).json({ hello: 'world' })
}

export default withSessionRoute(handler)
