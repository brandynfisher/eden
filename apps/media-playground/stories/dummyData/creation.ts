import squareImageFile from '@/stories/assets/placeholder/dummy_1024x1024_ffffff_333.webp'
import { Creation, MediaType } from '@edenlabs/eden-sdk'

const CreationData: Creation = {
  _id: '123',
  task: '',
  uri: squareImageFile.src,
  thumbnail: squareImageFile.src,
  name: 'prompt or something',
  attributes: {},
  mediaAttributes: {
    type: MediaType.Image,
    width: squareImageFile.width,
    height: squareImageFile.height,
  },
  user: {
    _id: '456',
    username: 'Test',
    userImage: 'https://123.png',
    userId: '2xwwewe',
  },
  createdAt: '',
  updatedAt: '',
}

export default CreationData
