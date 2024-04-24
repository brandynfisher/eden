import Homepage from './page'
import type { Meta, StoryObj } from '@storybook/react'

const meta = {
  title: 'Pages/Home',
  component: Homepage,
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'fullscreen',
  },
} satisfies Meta<typeof Homepage>

export default meta
type Story = StoryObj<typeof meta>

export const LoggedOut: Story = {}
