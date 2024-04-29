import squareImageFile from '@/stories/assets/placeholder/dummy_1024x1024_ffffff_333.webp'
import landscapeImageFile from '@/stories/assets/placeholder/dummy_1536x640_ffffff_082d60.webp'
import portraitImageFile from '@/stories/assets/placeholder/dummy_640x1536_ffffff_5423a3.webp'
import { Creation, MediaType } from '@edenlabs/eden-sdk'
import CreatorData from '@/stories/dummyData/creator'

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
  user: CreatorData,
  createdAt: '',
  updatedAt: '',
}

export const CreationDataLandscape: Creation = {
  _id: '123',
  task: '',
  uri: landscapeImageFile.src,
  thumbnail: landscapeImageFile.src,
  name: 'prompt or something',
  attributes: {},
  mediaAttributes: {
    type: MediaType.Image,
    width: landscapeImageFile.width,
    height: landscapeImageFile.height,
  },
  user: CreatorData,
  createdAt: '',
  updatedAt: '',
}

export const CreationDataPortrait: Creation = {
  _id: '123',
  task: '',
  uri: portraitImageFile.src,
  thumbnail: portraitImageFile.src,
  name: 'prompt or something',
  attributes: {},
  mediaAttributes: {
    type: MediaType.Image,
    width: portraitImageFile.width,
    height: portraitImageFile.height,
  },
  user: CreatorData,
  createdAt: '',
  updatedAt: '',
}

export default CreationData
