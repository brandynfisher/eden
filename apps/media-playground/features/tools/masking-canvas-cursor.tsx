import React, { useEffect, useState } from 'react'

type MaskingCanvasCursorProps = {
  size: number
  opacity: number
  canvasRef: React.RefObject<HTMLCanvasElement>
  scale: number
  translate: { x: number; y: number }
}

const MaskingCanvasCursor: React.FC<MaskingCanvasCursorProps> = ({
  size,
  opacity,
  canvasRef,
  scale,
  translate,
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return

      const canvas = canvasRef.current
      const rect = canvas.getBoundingClientRect()

      // Get position relative to the canvas element
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      // Calculate scaling factor between internal canvas resolution and display size
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height

      // Convert to canvas coordinates
      const finalX = x * scaleX
      const finalY = y * scaleY

      console.log('Cursor Coordinates:', {
        clientPos: { x: e.clientX, y: e.clientY },
        canvasRect: rect,
        relativePos: { x, y },
        canvasScale: { scaleX, scaleY },
        finalPos: { x: finalX, y: finalY },
        zoom: scale,
        translation: translate,
      })

      setPosition({ x: finalX, y: finalY })
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [canvasRef, scale, translate])

  if (!canvasRef.current) return null

  const canvas = canvasRef.current
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height

  // Convert back from canvas coordinates to screen coordinates
  const unscaledX = position.x / scaleX
  const unscaledY = position.y / scaleY

  // Apply zoom and translation in reverse (divide by zoom since we're going from zoomed to unzoomed space)
  const screenX = unscaledX / scale + translate.x
  const screenY = unscaledY / scale + translate.y

  console.log('Cursor Display:', {
    position,
    unscaledCoords: { x: unscaledX, y: unscaledY },
    screenCoords: { x: screenX, y: screenY },
    scale,
    translate,
  })

  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        width: '100%',
        height: '100%',
      }}
    >
      <div
        className="absolute border-2 border-white rounded-full"
        style={{
          width: `${size * scale}px`,
          height: `${size * scale}px`,
          transform: `translate(${screenX - (size * scale) / 2}px, ${
            screenY - (size * scale) / 2
          }px)`,
          opacity,
        }}
      />
    </div>
  )
}

export default MaskingCanvasCursor
