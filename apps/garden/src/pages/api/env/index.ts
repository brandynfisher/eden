import { NextApiRequest, NextApiResponse } from 'next'
import { CONFIG } from '@/lib/config'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  return res.status(200).json({
    process: {
      NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      NEXT_PUBLIC_CLOUDINARY_API_KEY: process.env.NEXT_PUBLIC_CLOUDINARY_API_KEY
    },
    CONFIG: {
      NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: CONFIG.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      NEXT_PUBLIC_CLOUDINARY_API_KEY: CONFIG.NEXT_PUBLIC_CLOUDINARY_API_KEY
    }
  });
}