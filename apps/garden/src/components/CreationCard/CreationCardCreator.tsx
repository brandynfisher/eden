import { useHover } from '@mantine/hooks'
import { Avatar } from 'antd'
import Link from 'next/link'

const CreationCardCreator = ({ creatorId }: { creatorId: string }) => {
  const { hovered, ref } = useHover()

  const truncatedId = `${creatorId.slice(0, 5)}...${creatorId.slice(-4)}`

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
  }

  return (
    <div
      ref={ref}
      className="flex items-center relative mb-4 mx-4"
      onClick={handleClick}
    >
      <div className="absolute inset-0 bg-gray-800 opacity-50 rounded" />
      <div className="z-10">
        {' '}
        <Link
          href={{
            pathname: `/creators/${creatorId}`,
          }}
          style={{
            textDecoration: hovered ? 'underline' : 'unset',
            color: 'white',
          }}
          className="flex items-center text-white mr-2"
        >
          <Avatar size={50} className="mr-2" />{' '}
          <div className="text-sm font-bold overflow-hidden whitespace-nowrap">
            {truncatedId}
          </div>
        </Link>
      </div>
    </div>
  )
}

export default CreationCardCreator
