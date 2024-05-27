import React, { useEffect, useRef } from 'react'

interface Pixel {
  x: number
  y: number
  size: number
  color: string
  targetX: number
  targetY: number
  targetSize: number
  transitionProgress: number
}

const FractalCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  let pixels: Pixel[] = [
    {
      x: 0,
      y: 0,
      size: 800,
      color: 'hsla(200, 100%, 50%, 1)',
      targetX: 0,
      targetY: 0,
      targetSize: 800,
      transitionProgress: 0,
    },
  ]

  const hueRange = [200, 210]
  const lerp = (start: number, end: number, t: number) =>
    (1 - t) * start + t * end
  const draw = (ctx: CanvasRenderingContext2D, pixelArr: Pixel[]) => {
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height)
    pixelArr.forEach(pixel => {
      ctx.fillStyle = pixel.color
      ctx.fillRect(pixel.x, pixel.y, pixel.size, pixel.size)
    })
  }

  const subdivide = (pixelArr: Pixel[]) => {
    const newPixels: Pixel[] = []
    pixelArr.forEach(pixel => {
      const half = pixel.size / 2
      const randomHue =
        Math.random() * (hueRange[1] - hueRange[0]) + hueRange[0]

      for (let y = 0; y < 2; y++) {
        for (let x = 0; x < 2; x++) {
          const targetX = pixel.x + x * half
          const targetY = pixel.y + y * half
          newPixels.push({
            x: pixel.x,
            y: pixel.y,
            size: pixel.size,
            color: `hsla(${randomHue}, 100%, 50%, 1)`,
            targetX,
            targetY,
            targetSize: half,
            transitionProgress: 0,
          })
        }
      }
    })
    return newPixels
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')

    if (context) {
      let animationId: number
      let subdivisionCounter = 0
      let drawNextFrame = true

      const animate = () => {
        if (drawNextFrame) {
          pixels.forEach(pixel => {
            if (pixel.transitionProgress < 1) {
              drawNextFrame = false
              pixel.transitionProgress += 0.01
              pixel.x = lerp(pixel.x, pixel.targetX, pixel.transitionProgress)
              pixel.y = lerp(pixel.y, pixel.targetY, pixel.transitionProgress)
              pixel.size = lerp(
                pixel.size,
                pixel.targetSize,
                pixel.transitionProgress,
              )
            }
          })

          draw(context, pixels)
        }

        if (drawNextFrame) {
          if (subdivisionCounter < 4) {
            pixels = subdivide(pixels)
            // subdivisionCounter = ++;
          } else {
            return
          }
        }

        animationId = requestAnimationFrame(animate)
      }

      animationId = requestAnimationFrame(animate)

      return () => cancelAnimationFrame(animationId)
    }
  }, [])

  return <canvas ref={canvasRef} width="800" height="800" />
}

export default FractalCanvas
