import { CONFIG } from '@/lib/config'
import { withSessionRoute } from '@/lib/withSession'
import axios from 'axios'
import formidable from 'formidable'
import fs from 'fs'
import { NextApiRequest, NextApiResponse } from 'next'

export const config = {
  api: {
    bodyParser: false,
  },
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const authToken = req.session.token

  if (!authToken) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  const form = new formidable.IncomingForm()

  return new Promise((resolve, reject) => {
    form.parse(
      req,
      async (
        error: Error | null,
        _: formidable.Fields,
        files: formidable.Files,
      ) => {
        if (error) {
          return reject(error.message)
        }
        const file = files.file as formidable.File
        const buffer = await fs.readFileSync(file.filepath)
        const blob = new Blob([buffer])
        const formData = new FormData()
        formData.append('file', blob)
        const response = await axios.post(
          `${CONFIG.API_URL}/media/upload`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
              'Content-Type': 'multipart/form-data',
            },
          },
        )
        const { url } = response.data
        resolve({ fileUrl: url })
      },
    )
  })
    .then(result => {
      return res.status(200).json(result)
    })
    .catch(error => {
      return res.status(500).json({ error })
    })
}

export default withSessionRoute(handler)
