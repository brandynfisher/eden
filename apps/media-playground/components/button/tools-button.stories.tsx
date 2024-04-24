import ToolsButton from '@/components/button/tools-button'
import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta<typeof ToolsButton> = {
  title: 'Atoms/Button/ToolsButton',
  component: ToolsButton,
  // tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ToolsButton>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: {},
}
