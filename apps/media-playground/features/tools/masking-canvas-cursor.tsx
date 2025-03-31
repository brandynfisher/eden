import React, { useEffect, useState } from 'react'

type MaskingCanvasCursorProps = {
  size: number
  canvasRef: React.RefObject<HTMLCanvasElement>
  scale: number
  translate: { x: number; y: number }
}

const MaskingCanvasCursor: React.FC<MaskingCanvasCursorProps> = ({
  size,
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

  // First apply translation in zoomed space, then unzoom
  const screenX = (unscaledX + translate.x) / scale
  const screenY = (unscaledY + translate.y) / scale

  // Convert the cursor size from canvas coordinates to screen coordinates
  // size is in canvas coordinates (like line width)
  // First convert to screen coordinates by dividing by canvas scale
  // Then divide by zoom to match the current view
  // Multiply by 2.5 to match the line width visually
  const cursorSize = (size * 2.5) / scaleX / scale

  return (
    <div
      className="pointer-events-none fixed inset-0"
      style={{
        width: '100%',
        height: '100%',
        isolation: 'isolate',
        zIndex: 50,
      }}
    >
      {/* Main cursor with background and border */}
      <div
        className="absolute rounded-full"
        style={{
          width: `${cursorSize}px`,
          height: `${cursorSize}px`,
          transform: `translate(${screenX - cursorSize / 2}px, ${
            screenY - cursorSize / 2
          }px)`,
          backgroundColor: 'rgba(255, 255, 255, 0.4)',
          border: '2px solid white',
          outline: '1px solid black',
          outlineOffset: '-3px',
          isolation: 'isolate',
          mixBlendMode: 'difference',
        }}
      />
    </div>
  )
}

export default MaskingCanvasCursor
