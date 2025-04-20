import React, { useEffect, useState } from 'react'

type MaskingCanvasCursorProps = {
  size: number // This is the base display size passed from parent
  canvasRef: React.RefObject<HTMLCanvasElement>
  scale: number
  // translate: { x: number; y: number } // Removed unused prop again
}

const MaskingCanvasCursor: React.FC<MaskingCanvasCursorProps> = ({
  size,
  canvasRef,
  scale,
  // translate, // Removed unused prop again
}) => {
  const [position, setPosition] = useState({ x: 0, y: 0 })

  // Effect to track mouse position RELATIVE TO THE CANVAS VIEWPORT
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return

      const canvas = canvasRef.current
      const rect = canvas.getBoundingClientRect()

      // Mouse position relative to the canvas element's top-left corner in the viewport
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top

      setPosition({ x, y })
    }

    // Use window listener as mouse might be outside canvas bounds but still relevant
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [canvasRef]) // Only depends on canvasRef

  if (!canvasRef.current) return null

  // Calculate the visual size of the cursor on screen
  // The `size` prop is the brush size in *display pixels* if scale were 1.
  // We just need to multiply by the current CSS scale.
  const cursorSize = size * scale

  // Calculate position within the parent's transformed coordinate system (Removed translation adjustment)
  const innerX = position.x / scale
  const innerY = position.y / scale

  // Use absolute positioning within the parent container
  const cursorStyle: React.CSSProperties = {
    position: 'absolute',
    width: `${cursorSize}px`,
    height: `${cursorSize}px`,
    top: `${innerY}px`, // Use calculated inner position
    left: `${innerX}px`, // Use calculated inner position
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    border: '2px solid white',
    outline: '1px solid black',
    outlineOffset: '-3px',
    isolation: 'isolate',
    mixBlendMode: 'difference',
    pointerEvents: 'none',
    zIndex: 50,
    transform: `translate(-50%, -50%)`, // Center using transform
  }

  return (
    // The cursor is rendered *inside* the div that has the scale/translate transform in MaskingCanvas.tsx
    <div style={cursorStyle} />
  )
}

export default MaskingCanvasCursor
