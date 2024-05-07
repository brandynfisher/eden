import axios from 'axios'

async function requestSignedUploadUrl(
  fileHash: string,
  fileType: string,
): Promise<string> {
  try {
    const response = await axios.post('/api/media/upload', {
      filename: `${fileHash}.${fileType.split('/')[1]}`,
      contentType: fileType,
    })
    return response.data.signedUrl // Adjust according to your actual API response
  } catch (error) {
    console.error('Error requesting signed URL:', error)
    throw new Error('Failed to get signed URL')
  }
}