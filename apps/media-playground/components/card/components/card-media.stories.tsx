import CardMedia from '@/components/card/components/card-media'
import squareImageFile from '@/stories/assets/placeholder/dummy_1024x1024_ffffff_333.webp'
import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof CardMedia> = {
  title: 'Molecules/Card/CardMedia',
  component: CardMedia,
  render: ({ ...args }) => (
    <div className="min-w-64 max-w-sm">
      <CardMedia {...args} />
    </div>
  ),
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof CardMedia>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {
    media: {
      uri: squareImageFile.src,
      thumbnailUri: squareImageFile.src,
      width: squareImageFile.width,
      height: squareImageFile.height,
    },
    linkHref: '/item/id',
  },
}

export const Loading: Story = {
  args: {
    media: {
      uri: '/image/does/not/exist',
      thumbnailUri: '/image/does/not/exist',
      width: squareImageFile.width,
      height: squareImageFile.height,
    },
    linkHref: '/item/id',
  },
}

export const Error: Story = {
  args: {
    media: {
      uri: '',
      thumbnailUri: '',
      width: squareImageFile.width,
      height: squareImageFile.height,
    },
    linkHref: '/item/id',
  },
}
