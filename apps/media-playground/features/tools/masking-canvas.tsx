'use client'

import SliderInput from '@/components/form/input/slider-input'
import LoadingIndicator from '@/components/loading-indicator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { FormItem } from '@/components/ui/form'
import { Label } from '@/components/ui/label'
import MaskingCanvasCursor from '@/features/tools/masking-canvas-cursor'
import { uploadFileToS3 } from '@/lib/files'
import { cn } from '@/lib/utils'
import axios from 'axios'
import {
  BlendIcon,
  DownloadIcon,
  EraserIcon,
  FullscreenIcon,
  InfoIcon,
  MoveIcon,
  RedoIcon,
  TrashIcon,
  UndoIcon,
  UploadCloudIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from 'lucide-react'
import NextImage from 'next/image'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'

type MaskingCanvasProps = {
  form: UseFormReturn
  onChange: (fileUrl: string) => void
  // parameter: ToolParameterV2;
  inputImageFieldName: string
  width?: number
  height?: number
  strokeColor?: string
}

type Stroke = {
  points: { x: number; y: number }[]
  lineWidth: number
  lineOpacity: number
  color: string
  isErasing?: boolean
}

// const getTouchPos = (
//   canvas: HTMLCanvasElement,
//   touchEvent: React.TouchEvent<HTMLCanvasElement>,
// ) => {
//   const rect = canvas.getBoundingClientRect()
//   const touch = touchEvent.touches[0]
//   return {
//     x: touch.clientX - rect.left,
//     y: touch.clientY - rect.top,
//   }
// }

const MaskingCanvas: React.FC<MaskingCanvasProps> = ({
  form,
  onChange,
  inputImageFieldName,
  width = 512,
  height = 512,
}) => {
  const strokeColor = '#ffffff'
  const baseImage = form.watch(inputImageFieldName)
  const containerRef = useRef<HTMLDivElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const [displayDimensions, setDisplayDimensions] = useState<{
    width: number
    height: number
  } | null>(null)
  const [isUploading, setIsUploading] = useState<boolean>(false)
  const [isDrawing, setIsDrawing] = useState<boolean>(false)
  const [isErasing, setIsErasing] = useState<boolean>(false)
  const [isMoving, setIsMoving] = useState<boolean>(false)
  const [history, setHistory] = useState<Stroke[]>([])
  const [redoStack, setRedoStack] = useState<Stroke[]>([])
  const DEFAULT_LINE_WIDTH = 64
  const [lineWidth, setLineWidth] = useState<number>(DEFAULT_LINE_WIDTH)
  const [lineOpacity, setLineOpacity] = useState<number>(1)
  const [imageOpacity /* setImageOpacity */] = useState<number>(1)
  const [canvasOpacity /* setCanvasOpacity */] = useState<number>(0.75)
  const [imageDimensions, setImageDimensions] = useState<{
    width: number
    height: number
  } | null>(null)
  const [isInverted, setIsInverted] = useState<boolean>(false)
  const [scale, setScale] = useState<number>(1)
  const [translate, setTranslate] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  })
  const [isPanning, setIsPanning] = useState<boolean>(false)
  const [lastPanPos, setLastPanPos] = useState<{ x: number; y: number } | null>(
    null,
  )

  // Effect 1: Calculate Display Dimensions based on Container and Image
  useEffect(() => {
    const calculateAndSetDisplayDimensions = () => {
      if (containerRef.current && imageDimensions) {
        const container = containerRef.current
        const containerWidth = container.clientWidth
        // Calculate available height based on viewport and dialog content
        const availableHeight = window.innerHeight * 0.8 // Use 80% of viewport height
        const containerHeight = Math.max(
          container.clientHeight,
          availableHeight,
        )

        const imageAspectRatio = imageDimensions.width / imageDimensions.height
        let displayWidth, displayHeight
        const margin = 0.85 // Increased margin for better initial fit

        // First calculate based on width
        displayWidth = containerWidth * margin
        displayHeight = displayWidth / imageAspectRatio

        // If height exceeds container, recalculate based on height
        if (displayHeight > containerHeight * margin) {
          displayHeight = containerHeight * margin
          displayWidth = displayHeight * imageAspectRatio
        }

        // One final check to ensure width fits
        if (displayWidth > containerWidth * margin) {
          const scale = (containerWidth * margin) / displayWidth
          displayWidth *= scale
          displayHeight *= scale
        }

        setDisplayDimensions({
          width: Math.max(50, displayWidth), // Ensure minimum size
          height: Math.max(50, displayHeight),
        })
      } else if (containerRef.current) {
        // Fallback if imageDimensions are not yet loaded
        const container = containerRef.current
        const containerWidth = container.clientWidth
        const availableHeight = window.innerHeight * 0.8
        const containerHeight = Math.max(
          container.clientHeight,
          availableHeight,
        )
        setDisplayDimensions({
          width: containerWidth * 0.85,
          height: containerHeight * 0.85,
        })
      }
    }

    calculateAndSetDisplayDimensions() // Run on mount and when dependencies change
    window.addEventListener('resize', calculateAndSetDisplayDimensions)
    return () =>
      window.removeEventListener('resize', calculateAndSetDisplayDimensions)
  }, [imageDimensions]) // Correct dependency

  // --- Moved redrawHistory definition before Effect 2 ---
  const redrawHistory = useCallback(() => {
    // Add check for imageDimensions to prevent errors before it loads
    if (overlayCanvasRef.current && imageDimensions) {
      const ctx = overlayCanvasRef.current.getContext('2d')
      if (ctx) {
        ctx.clearRect(
          0,
          0,
          overlayCanvasRef.current.width,
          overlayCanvasRef.current.height,
        )

        history.forEach(
          ({ points, lineWidth, lineOpacity, color, isErasing }) => {
            ctx.lineWidth = lineWidth
            ctx.lineCap = 'round'
            ctx.lineJoin = 'round'
            ctx.globalAlpha = lineOpacity
            ctx.strokeStyle = color
            ctx.globalCompositeOperation = isErasing
              ? 'destination-out'
              : 'source-over'
            ctx.beginPath()

            points.forEach((point, index) => {
              if (index === 0) {
                ctx.moveTo(point.x, point.y)
              } else {
                ctx.lineTo(point.x, point.y)
              }
            })

            ctx.stroke()
            ctx.closePath()
          },
        )
      }
    }
  }, [history, imageDimensions])

  // Effect 2: Apply Dimensions and Redraw Canvas
  useEffect(() => {
    if (overlayCanvasRef.current && imageDimensions && displayDimensions) {
      const overlayCanvas = overlayCanvasRef.current

      // Set internal canvas resolution
      overlayCanvas.width = imageDimensions.width
      overlayCanvas.height = imageDimensions.height

      // Set display style dimensions
      overlayCanvas.style.width = `${displayDimensions.width}px`
      overlayCanvas.style.height = `${displayDimensions.height}px`

      redrawHistory() // Redraw when dimensions change
    }
  }, [displayDimensions, imageDimensions, redrawHistory]) // Correct dependencies

  // Update canvas dimensions when container or image dimensions change
  useEffect(() => {
    if (baseImage) {
      const img = new Image()
      img.src = baseImage
      img.onload = () => {
        setImageDimensions({ width: img.width, height: img.height })
      }
    }
  }, [baseImage]) // Correct dependency for this effect

  function getPointPos(
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) {
    if (!overlayCanvasRef.current || !displayDimensions) return { x: 0, y: 0 }

    const canvas = overlayCanvasRef.current
    const rect = canvas.getBoundingClientRect()

    let clientX, clientY
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    // Get position relative to the canvas element
    const x = clientX - rect.left
    const y = clientY - rect.top

    // Calculate scaling factor between internal canvas resolution and display size
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height

    // Convert to canvas coordinates
    const finalX = x * scaleX
    const finalY = y * scaleY

    return {
      x: finalX,
      y: finalY,
    }
  }

  const startDrawing = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    if (overlayCanvasRef.current) {
      const points = getPointPos(e)
      setIsDrawing(true)
      setHistory(prevHistory => [
        ...prevHistory,
        {
          points: [points],
          lineWidth,
          lineOpacity,
          color: strokeColor,
          isErasing,
        },
      ])
    }
  }

  const draw = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    if (!isDrawing || !overlayCanvasRef.current) return
    const points = getPointPos(e)
    setHistory(prevHistory => {
      const newHistory = [...prevHistory]
      const currentStroke = newHistory[newHistory.length - 1]
      currentStroke.points.push(points)
      return newHistory
    })
    redrawHistory()
  }

  const endDrawing = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    setRedoStack([])
  }

  const handleMouseDown = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    if (isMoving) {
      e.preventDefault() // Prevent default dragging behavior
      const rect = overlayCanvasRef.current?.getBoundingClientRect()
      if (!rect) return

      let clientX, clientY
      if ('touches' in e) {
        clientX = e.touches[0].clientX
        clientY = e.touches[0].clientY
      } else {
        clientX = e.clientX
        clientY = e.clientY
      }

      setLastPanPos({ x: clientX, y: clientY })
      setIsPanning(true)
    } else {
      startDrawing(e)
    }
  }

  const handleMouseMove = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    if (isPanning && lastPanPos) {
      let clientX, clientY
      if ('touches' in e) {
        clientX = e.touches[0].clientX
        clientY = e.touches[0].clientY
      } else {
        clientX = e.clientX
        clientY = e.clientY
      }

      const deltaX = (clientX - lastPanPos.x) / scale
      const deltaY = (clientY - lastPanPos.y) / scale

      setTranslate(prevTranslate => ({
        x: prevTranslate.x + deltaX,
        y: prevTranslate.y + deltaY,
      }))

      setLastPanPos({ x: clientX, y: clientY })
    } else if (isDrawing) {
      draw(e)
    }
  }

  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false)
      setLastPanPos(null)
    } else {
      endDrawing()
    }
  }

  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    handleMouseDown(e)
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    handleMouseMove(e)
  }

  const handleTouchEnd = () => {
    handleMouseUp()
  }

  const toggleMove = () => {
    setIsMoving(prev => !prev)
  }

  const undo = () => {
    if (history.length > 0) {
      const newHistory = history.slice(0, -1)
      const currentData = history[history.length - 1]
      setHistory(newHistory)
      setRedoStack(prevRedoStack => [currentData, ...prevRedoStack])
      redrawHistory()
    }
  }

  const redo = () => {
    if (redoStack.length > 0) {
      const [redoStroke, ...remainingRedoStack] = redoStack
      setRedoStack(remainingRedoStack)
      setHistory(prevHistory => {
        const newHistory = [...prevHistory, redoStroke]
        redrawHistory()
        return newHistory
      })
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

  const extractMimeType = (dataUrlHeader: string): string => {
    const mimeMatch = dataUrlHeader.match(/:(.*?);/)
    return mimeMatch ? mimeMatch[1] : ''
  }

  const decodeBase64ToUint8Array = (base64String: string): Uint8Array => {
    const byteString = atob(base64String)
    const byteStringLength = byteString.length
    const u8Array = new Uint8Array(byteStringLength)
    for (let i = 0; i < byteStringLength; i++) {
      u8Array[i] = byteString.charCodeAt(i)
    }
    return u8Array
  }

  const dataUrlToFile = (dataUrl: string, fileName: string): File => {
    const [header, base64Data] = dataUrl.split(',')
    const mimeType = extractMimeType(header)
    const byteArray = decodeBase64ToUint8Array(base64Data)
    return new File([byteArray], fileName, { type: mimeType })
  }

  const exportCanvasToDataUrl = (overlayCanvas: HTMLCanvasElement) => {
    // Create an off-screen canvas with the original dimensions (width and height props)
    const offScreenCanvas = document.createElement('canvas')
    offScreenCanvas.width = imageDimensions?.width ?? width
    offScreenCanvas.height = imageDimensions?.height ?? height
    const offCtx = offScreenCanvas.getContext('2d')

    if (offCtx) {
      // Fill the off-screen canvas with a black background
      offCtx.fillStyle = '#000000'
      offCtx.fillRect(0, 0, offScreenCanvas.width, offScreenCanvas.height)

      // Draw the overlay canvas onto the off-screen canvas
      offCtx.drawImage(
        overlayCanvas,
        0,
        0,
        imageDimensions?.width ?? width,
        imageDimensions?.height ?? height,
      )

      const dataUrl = offScreenCanvas.toDataURL()
      offScreenCanvas.remove()
      // Return the data URL of the resized mask
      return dataUrl
    }
  }

  const saveMask = () => {
    if (!overlayCanvasRef.current) return

    // Save the resulting image
    const link = document.createElement('a')
    const dataUrl = exportCanvasToDataUrl(overlayCanvasRef.current)

    if (!dataUrl) return

    link.href = dataUrl
    link.download = `mask_${Date.now()}.png`
    link.click()
  }

  const useMask = async () => {
    if (!overlayCanvasRef.current) return

    const dataUrl = exportCanvasToDataUrl(overlayCanvasRef.current)

    if (!dataUrl) return

    setIsUploading(true)
    const file = dataUrlToFile(dataUrl, `mask_${Date.now()}.png`)
    const cancelSource = axios.CancelToken.source()

    try {
      const uploadedFile = await uploadFileToS3({
        file,
        onUploadProgress: progressEvent => console.log(progressEvent),
        cancelSource,
      })

      onChange(uploadedFile.fileUrl)
    } catch (error) {
      console.error('Error uploading file:', error)
    } finally {
      setIsUploading(false)
    }
  }

  const toggleInvert = () => {
    setIsInverted(prev => !prev)
  }

  const toggleEraser = () => {
    setIsErasing(prev => !prev)
  }

  return (
    <div ref={containerRef} className={cn(['w-full flex flex-col h-full'])}>
      {!baseImage ? (
        <Alert variant="destructive" className="text-sm">
          <AlertDescription className="flex gap-2 items-center">
            <InfoIcon className="h-4 w-4" />
            You need to set a starting image before drawing a mask
          </AlertDescription>
        </Alert>
      ) : (
        <>
          <div className="grow min-h-0 relative rounded-md overflow-hidden border border-purple-600 mb-2 select-none">
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="relative"
                style={{
                  transform: `scale(${scale}) translate(${translate.x}px, ${translate.y}px)`,
                  transformOrigin: 'center',
                  width: displayDimensions?.width ?? 'auto',
                  height: displayDimensions?.height ?? 'auto',
                  willChange: isPanning ? 'transform' : 'auto',
                }}
              >
                {baseImage && imageDimensions && displayDimensions && (
                  <>
                    {overlayCanvasRef && !isMoving && (
                      <MaskingCanvasCursor
                        size={
                          (lineWidth * (displayDimensions?.width ?? width)) /
                          (imageDimensions?.width ?? width)
                        }
                        canvasRef={overlayCanvasRef}
                        scale={scale}
                      />
                    )}
                    <NextImage
                      src={baseImage}
                      alt="Base Image"
                      width={imageDimensions.width}
                      height={imageDimensions.height}
                      className="select-none absolute top-0 left-0 w-full h-full"
                      style={{
                        opacity: imageOpacity,
                      }}
                      priority={true}
                    />
                  </>
                )}
                <canvas
                  data-custom-cursor={true}
                  ref={overlayCanvasRef}
                  className={cn([
                    'select-none absolute top-0 left-0 w-full h-full',
                    'cursor-crosshair',
                    isInverted ? 'invert' : '',
                    isMoving ? 'cursor-move' : '',
                  ])}
                  onTouchStart={handleTouchStart}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  style={{
                    opacity: canvasOpacity,
                  }}
                />
              </div>
            </div>
          </div>
          <div className="shrink-0 flex flex-wrap gap-1.5 w-full bg-secondary p-1 rounded-md">
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

            <div>
              <Button
                type="button"
                className={isInverted ? 'bg-purple-900' : 'bg-secondary'}
                size={'sm'}
                variant={'outline'}
                onClick={toggleInvert}
                title="Invert mask colors (does not change output)"
              >
                <BlendIcon className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                className={isErasing ? 'bg-purple-900' : 'bg-secondary'}
                size={'sm'}
                variant={'outline'}
                disabled={!history.length}
                onClick={toggleEraser}
                title="Toggle Eraser"
              >
                <EraserIcon className="h-4 w-4" />
              </Button>
            </div>
            <div>
              <Button
                disabled={scale >= 4}
                variant="outline"
                type="button"
                size={'sm'}
                onClick={() =>
                  setScale(prevScale =>
                    Math.min(Math.max(prevScale * 1.1, 0.5), 4),
                  )
                }
                title="Zoom In"
              >
                <ZoomInIcon className="h-4 w-4" />
              </Button>
              <Button
                disabled={scale <= 0.5}
                variant="outline"
                type="button"
                size={'sm'}
                onClick={() =>
                  setScale(prevScale =>
                    Math.min(Math.max(prevScale * 0.9, 0.5), 4),
                  )
                }
                title="Zoom Out"
              >
                <ZoomOutIcon className="h-4 w-4" />
              </Button>
              <Button
                className={isMoving ? 'bg-purple-900' : 'bg-secondary'}
                variant="outline"
                type="button"
                size={'sm'}
                onClick={toggleMove}
                title="Move viewport"
              >
                <MoveIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                type="button"
                size={'sm'}
                onClick={() => {
                  setScale(1)
                  setTranslate({ x: 0, y: 0 })
                }}
                title="Reset Viewport"
              >
                <FullscreenIcon className="h-4 w-4" />
              </Button>
            </div>

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
          <div className="shrink-0 w-full mt-2">
            <div className="flex gap-2 mb-2">
              {/* <FormItem className="w-full space-y-1.5">
                <Label className="text-xs">Image Opacity</Label>
                <SliderInput
                  hideNumberInput={true}
                  type={'float'}
                  min={0}
                  max={1}
                  step={0.05}
                  value={imageOpacity}
                  onChange={(newVal: number | undefined) => {
                    setImageOpacity(newVal === undefined ? 1 : newVal)
                  }}
                />
              </FormItem> */}
              {/* <FormItem className="w-full space-y-1.5">
                <Label className="text-xs">Canvas Opacity</Label>
                <SliderInput
                  hideNumberInput={true}
                  type={'float'}
                  min={0}
                  max={1}
                  step={0.05}
                  value={canvasOpacity}
                  onChange={(newVal: number | undefined) => {
                    setCanvasOpacity(newVal === undefined ? 1 : newVal)
                  }}
                />
              </FormItem> */}
            </div>

            <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
              <Button
                variant="secondary"
                type="button"
                disabled={isUploading || !history.length}
                onClick={useMask}
                className="order-2 md:order-1 w-full md:w-[200px]"
              >
                {isUploading ? (
                  <LoadingIndicator className="h-4 w-4 mr-2" />
                ) : (
                  <UploadCloudIcon className="h-4 w-4 mr-2 " />
                )}
                Use mask
              </Button>

              <FormItem className="w-full order-1 md:order-2 space-y-1.5">
                <Label className="text-xs">Line Width</Label>
                <SliderInput
                  type={'integer'}
                  min={1}
                  max={420}
                  step={1}
                  value={lineWidth}
                  onChange={(newVal: number | undefined) => {
                    setLineWidth(newVal || 1)
                  }}
                />
              </FormItem>

              <FormItem className="hidden">
                <Label>Line Opacity</Label>
                <SliderInput
                  type={'float'}
                  min={0.05}
                  max={1}
                  step={0.05}
                  value={lineOpacity}
                  onChange={(newVal: number | undefined) => {
                    setLineOpacity(newVal || 1)
                  }}
                />
              </FormItem>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default MaskingCanvas
