import SliderInput from '@/components/form/input/slider-input'
import { Button } from '@/components/ui/button'
import { FormItem } from '@/components/ui/form'
import { Label } from '@/components/ui/label'
import {
  BlendIcon,
  DownloadIcon,
  RedoIcon,
  TrashIcon,
  UndoIcon,
} from 'lucide-react'
import NextImage from 'next/image'
import React, { useEffect, useRef, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'

type MaskingCanvasProps = {
  form: UseFormReturn
  baseImageFieldName: string
  width?: number
  height?: number
}

type Stroke = {
  imageDataUrl: string
  lineOpacity: number
}

const MaskingCanvas: React.FC<MaskingCanvasProps> = ({
  form,
  baseImageFieldName,
  width = 512,
  height = 512,
}) => {
  const baseImage = form.watch(baseImageFieldName)

  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const [isDrawing, setIsDrawing] = useState<boolean>(false)
  const [history, setHistory] = useState<Stroke[]>([])
  const [redoStack, setRedoStack] = useState<Stroke[]>([])
  const [lineWidth, setLineWidth] = useState<number>(15)
  const [lineOpacity, setLineOpacity] = useState<number>(1)
  const [imageOpacity, setImageOpacity] = useState<number>(0.5)
  const [imageDimensions, setImageDimensions] = useState<{
    width: number
    height: number
  } | null>(null)
  const [isInverted, setIsInverted] = useState<boolean>(false)

  useEffect(() => {
    if (baseImage) {
      const img = new Image()
      img.src = baseImage
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height })
      }
    }
  }, [baseImage])

  useEffect(() => {
    const handleResize = () => {
      if (overlayCanvasRef.current && imageDimensions) {
        const overlayCanvas = overlayCanvasRef.current
        const newWidth = overlayCanvas.parentElement?.offsetWidth || width
        const newHeight =
          (newWidth / imageDimensions.width) * imageDimensions.height
        overlayCanvas.width = newWidth
        overlayCanvas.height = newHeight
        redrawHistory()
      }
    }

    window.addEventListener('resize', handleResize)
    handleResize()

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [imageDimensions, history, width, height])

  const redrawHistory = () => {
    if (overlayCanvasRef.current) {
      const ctx = overlayCanvasRef.current.getContext('2d')
      if (ctx) {
        ctx.clearRect(
          0,
          0,
          overlayCanvasRef.current.width,
          overlayCanvasRef.current.height,
        )
        history.forEach(({ imageDataUrl, lineOpacity }) => {
          const img = new Image()
          img.src = imageDataUrl
          img.onload = () => {
            ctx.globalAlpha = lineOpacity
            ctx.drawImage(img, 0, 0)
          }
        })
      }
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (overlayCanvasRef.current) {
      setIsDrawing(true)
      const { offsetX, offsetY } = e.nativeEvent
      const ctx = overlayCanvasRef.current.getContext('2d')
      if (ctx) {
        ctx.lineWidth = lineWidth
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.globalAlpha = lineOpacity
        ctx.beginPath()
        ctx.moveTo(offsetX, offsetY)
      }
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !overlayCanvasRef.current) return
    const { offsetX, offsetY } = e.nativeEvent
    const ctx = overlayCanvasRef.current.getContext('2d')
    if (ctx) {
      ctx.lineTo(offsetX, offsetY)
      ctx.stroke()
    }
  }

  const endDrawing = () => {
    if (!isDrawing) return
    setIsDrawing(false)

    if (overlayCanvasRef.current) {
      const ctx = overlayCanvasRef.current.getContext('2d')
      if (ctx) {
        ctx.closePath()
        const currentImageData = overlayCanvasRef.current.toDataURL()
        setHistory(prevHistory => {
          const newHistory = [
            ...prevHistory,
            { imageDataUrl: currentImageData, lineOpacity },
          ]
          setRedoStack([])
          return newHistory
        })
      }
    }
  }

  const undo = () => {
    if (history.length > 0) {
      const newHistory = history.slice(0, -1)
      const currentData = history[history.length - 1]
      setHistory(newHistory)
      setRedoStack(prevRedoStack => [currentData, ...prevRedoStack])
      redrawHistoryWithHistory(newHistory)
    }
  }

  const redo = () => {
    if (redoStack.length > 0) {
      const [redoStroke, ...remainingRedoStack] = redoStack
      setRedoStack(remainingRedoStack)
      setHistory(prevHistory => {
        const newHistory = [...prevHistory, redoStroke]
        redrawHistoryWithHistory(newHistory)
        return newHistory
      })
    }
  }

  const redrawHistoryWithHistory = (historyToDraw: Stroke[]) => {
    if (overlayCanvasRef.current) {
      const ctx = overlayCanvasRef.current.getContext('2d')
      if (ctx) {
        ctx.clearRect(
          0,
          0,
          overlayCanvasRef.current.width,
          overlayCanvasRef.current.height,
        )
        historyToDraw.forEach(({ imageDataUrl, lineOpacity }) => {
          const img = new Image()
          img.src = imageDataUrl
          img.onload = () => {
            ctx.globalAlpha = lineOpacity
            ctx.drawImage(img, 0, 0)
          }
        })
      }
    }
  }

  const clearCanvas = () => {
    if (overlayCanvasRef.current) {
      const ctx = overlayCanvasRef.current.getContext('2d')
      if (ctx) {
        ctx.clearRect(
          0,
          0,
          overlayCanvasRef.current.width,
          overlayCanvasRef.current.height,
        )
        setHistory([])
        setRedoStack([])
      }
    }
  }

  const saveMask = () => {
    if (overlayCanvasRef.current) {
      const link = document.createElement('a')
      link.href = overlayCanvasRef.current.toDataURL()
      link.download = 'mask.png'
      link.click()
    }
  }

  const toggleInvert = () => {
    setIsInverted(prev => !prev)
  }

  if (!baseImage) {
    return null
  }

  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center">
      <div className="relative w-full rounded-md overflow-hidden border border-purple-600 mb-2">
        {baseImage && (
          <NextImage
            src={baseImage}
            alt="Base Image"
            width={imageDimensions?.width || width}
            height={imageDimensions?.height || height}
            className="absolute top-0 left-0 w-full h-full"
            style={{
              aspectRatio: imageDimensions
                ? `${imageDimensions.width} / ${imageDimensions.height}`
                : '1',
              opacity: imageOpacity,
            }}
          />
        )}
        <canvas
          ref={overlayCanvasRef}
          className={`relative z-10 w-full h-full ${
            isInverted ? 'invert' : ''
          }`}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          width={width}
          height={height}
          style={{
            aspectRatio: imageDimensions
              ? `${imageDimensions.width} / ${imageDimensions.height}`
              : '1',
          }}
        />

        {history.length === 0 && !isDrawing && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-popover-foreground text-shadow-sm shadow-popover text-lg">
            <div className="bg-accent bg-opacity-70 rounded-md py-1 px-2">
              Draw a mask here
            </div>
          </div>
        )}
      </div>
      <div className="flex flex-wrap gap-2 w-full bg-secondary p-1 rounded-md">
        <div>
          <Button
            type="button"
            size={'sm'}
            variant="outline"
            onClick={undo}
            disabled={!history.length}
            title={'Undo'}
          >
            <UndoIcon className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size={'sm'}
            variant="outline"
            onClick={redo}
            disabled={!redoStack.length}
            title={'Redo'}
          >
            <RedoIcon className="h-4 w-4" />
          </Button>
        </div>

        <Button
          type="button"
          size={'sm'}
          variant="outline"
          onClick={clearCanvas}
          disabled={!history.length}
          title="Clear canvas"
        >
          <TrashIcon className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          size={'sm'}
          variant="outline"
          onClick={toggleInvert}
          title="Invert mask colors (does not change output)"
        >
          <BlendIcon className="h-4 w-4" />
        </Button>
        <Button
          className="ml-auto flex items-center"
          type="button"
          size={'sm'}
          variant="outline"
          onClick={saveMask}
          disabled={!history.length}
          title={'Download drawing as png'}
        >
          <DownloadIcon className="h-4 w-4" />
        </Button>
      </div>
      <div className="w-full mt-4">
        <FormItem className="mb-4">
          <Label>Image Opacity</Label>
          <SliderInput
            type={'float'}
            min={0.1}
            max={1}
            step={0.1}
            value={imageOpacity}
            onChange={(newVal: number | undefined) => {
              setImageOpacity(newVal || 1)
            }}
          />
        </FormItem>
        <FormItem className="mb-4">
          <Label>Line Width</Label>
          <SliderInput
            type={'int'}
            min={1}
            max={100}
            step={1}
            value={lineWidth}
            onChange={(newVal: number | undefined) => {
              setLineWidth(newVal || 1)
            }}
          />
        </FormItem>
        <FormItem>
          <Label>Line Opacity</Label>
          <SliderInput
            type={'float'}
            min={0.1}
            max={1}
            step={0.1}
            value={lineOpacity}
            onChange={(newVal: number | undefined) => {
              setLineOpacity(newVal || 1)
            }}
          />
        </FormItem>
      </div>
    </div>
  )
}

export default MaskingCanvas
