import CreationCard from '@/components/CreationCard/CreationCard'
import React from 'react'

type MasonryRowProps = {
  children: React.ReactNode
}

const MasonryRow: React.FC<MasonryRowProps> = ({ children }) => {
  return <div className="grid gap-4">{children}</div>
}

type MasonryProps = {
  images: string[][]
}

const Masonry: React.FC<MasonryProps> = ({ images }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {images.map((image, index) => (
        <MasonryRow key={index}>
          {image.map((src, i) => (
            <CreationCard key={i} img={src} />
          ))}
        </MasonryRow>
      ))}
    </div>
  )
}

export default Masonry
