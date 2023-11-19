import { getAuthToken } from '@/lib/auth'
import { CONFIG } from '@/lib/config'
import axios from 'axios'
import FormData from 'form-data'
import formidable, { Fields, Files } from 'formidable'
import fs from 'fs'
import { NextApiRequest, NextApiResponse } from 'next'

export const config = {
  api: {
    bodyParser: false,
  },
}

interface ParseResult {
  fields: Fields
  files: Files
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  const authToken = await getAuthToken(req)
  if (!authToken) {
    return res.status(401).json({ error: 'Not authenticated' })
  }

  try {
    const form = new formidable.IncomingForm()
    const { files } = await new Promise<ParseResult>((resolve, reject) =>
      form.parse(req, (err, fields, files) => {
        if (err) reject(err)
        resolve({ fields, files })
      }),
    )

    const file = files.file as formidable.File
    const buffer = fs.readFileSync(file.filepath)
    const formData = new FormData()
    formData.append('file', buffer, file.newFilename)

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
    return res.status(200).json({ fileUrl: url })
  } catch (error) {
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export default handler
