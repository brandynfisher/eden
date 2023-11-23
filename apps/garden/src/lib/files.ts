import axios from 'axios'

export const downloadFileBlob = async (url: string, fileName: string) => {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    const blobUrl = URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = blobUrl
    link.download = fileName
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    URL.revokeObjectURL(blobUrl)
    return true
  } catch (error) {
    console.error('Error downloading creation:', error)
    return false
  }
}

export const downloadFile = async (url: string, fileName: string) => {
  try {
    const response = await axios.get(`/api/media/download?url=${url}`)
    const link = document.createElement('a')
    const parsedUrl = new URL(url)
    const extension = parsedUrl.pathname.split('.').pop()
    link.download = `${fileName}.${extension}`
    link.href = response.data.signedUrl

    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    return true
  } catch (error) {
    console.error('Error downloading creation:', error)
    return false
  }
}
