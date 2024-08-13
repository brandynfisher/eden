import portraitImageFile from '@/stories/assets/placeholder/dummy_640x1536_ffffff_5423a3.webp'
import squareImageFile from '@/stories/assets/placeholder/dummy_1024x1024_ffffff_333.webp'
import landscapeImageFile from '@/stories/assets/placeholder/dummy_1536x640_ffffff_082d60.webp'
import CreatorData from '@/stories/dummyData/creator'
import { CreationV2, MediaType } from '@edenlabs/eden-sdk'

const CreationData: CreationV2 = {
  _id: '123',
  url: squareImageFile.src,
  thumbnail: squareImageFile.src,
  mediaAttributes: {
    type: MediaType.Image,
    mimeType: 'image/jpeg',
    width: squareImageFile.width,
    height: squareImageFile.height,
  },
  user: CreatorData,
  isPrivate: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  // @ts-ignore
  task: '123',
}

export const CreationDataLandscape: CreationV2 = {
  _id: '123',
  url: landscapeImageFile.src,
  thumbnail: landscapeImageFile.src,
  mediaAttributes: {
    type: MediaType.Image,
    mimeType: 'image/jpeg',
    width: landscapeImageFile.width,
    height: landscapeImageFile.height,
  },
  user: CreatorData,
  createdAt: new Date(),
  updatedAt: new Date(),
  // @ts-ignore
  task: '123',
}

export const CreationDataPortrait: CreationV2 = {
  _id: '123',
  uri: portraitImageFile.src,
  thumbnail: portraitImageFile.src,
  name: 'prompt or something',
  args: {},
  mediaAttributes: {
    type: MediaType.Image,
    mimeType: 'image/jpeg',
    width: portraitImageFile.width,
    height: portraitImageFile.height,
  },
  user: CreatorData,
  createdAt: new Date(),
  updatedAt: new Date(),
  // @ts-ignore
  task: '',
}

export default CreationData
