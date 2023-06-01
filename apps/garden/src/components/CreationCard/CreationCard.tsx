import { useHover } from '@mantine/hooks'
import React from 'react'

const CreationCardOverlay = () => {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
      <div>Hovering</div>
    </div>
  )
}

const CreationCard = ({ img }: { img: string }) => {
  const { hovered, ref } = useHover()

  return (
    <div className="relative">
      <div className="rounded-lg" ref={ref}>
        <div style={{ position: 'relative' }}>
          <img src={img} alt="" className="w-full" />
          {hovered && <CreationCardOverlay />}
        </div>
      </div>
    </div>
  )
}

export default CreationCard
