'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  Upload,
  Download,
  Type,
  ImageIcon,
  Move,
  RotateCw,
  Palette,
  Layers,
  Settings,
  RefreshCw,
  Eye,
  EyeOff,
  Plus,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignTop,
  AlignMiddle,
  AlignBottom
} from 'lucide-react'
import { useCanvasOperations } from '@/lib/image/canvas-operations'
import { useFormatConverter } from '@/lib/image/format-converters'
import { usePerformanceMonitor } from '@/hooks/use-performance-monitor'
import type { Watermark, WatermarkPosition, WatermarkType } from '@/types/image'

interface WatermarkAdderProps {
  onComplete?: (watermarkedImages: File[]) => void
  maxFileSize?: number
  acceptedFormats?: string[]
}

interface WatermarkPreset {
  name: string
  type: WatermarkType
  content: string
  style: {
    fontSize: number
    fontFamily: string
    color: string
    opacity: number
  }
  position: WatermarkPosition
}

export const WatermarkAdder: React.FC<WatermarkAdderProps> = ({
  onComplete,
  maxFileSize = 10 * 1024 * 1024, // 10MB
  acceptedFormats = ['image/jpeg', 'image/png', 'image/webp']
}) => {
  const [images, setImages] = useState<File[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [originalImageData, setOriginalImageData] = useState<string[]>([])
  const [watermarkedImageData, setWatermarkedImageData] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingLog, setProcessingLog] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  // Watermark state
  const [watermarks, setWatermarks] = useState<Watermark[]>([])
  const [selectedWatermarkIndex, setSelectedWatermarkIndex] = useState<number | null>(null)
  const [previewMode, setPreviewMode] = useState(true)

  // Text watermark settings
  const [text, setText] = useState('')
  const [fontSize, setFontSize] = useState(24)
  const [fontFamily, setFontFamily] = useState('Arial')
  const [fontWeight, setFontWeight] = useState('normal')
  const [fontStyle, setFontStyle] = useState('normal')
  const [textColor, setTextColor] = useState('#ffffff')
  const [backgroundColor, setBackgroundColor] = useState('#000000')
  const [useBackground, setUseBackground] = useState(false)
  const [padding, setPadding] = useState(8)

  // Image watermark settings
  const [watermarkImage, setWatermarkImage] = useState<File | null>(null)
  const [watermarkImageUrl, setWatermarkImageUrl] = useState<string>('')
  const [imageOpacity, setImageOpacity] = useState(0.5)
  const [imageScale, setImageScale] = useState(0.2)
  const [tileMode, setTileMode] = useState(false)
  const [tileSpacing, setTileSpacing] = useState(100)

  // Position and effects
  const [position, setPosition] = useState<WatermarkPosition>('bottom-right')
  const [opacity, setOpacity] = useState(0.7)
  const [rotation, setRotation] = useState(0)
  const [marginX, setMarginX] = useState(20)
  const [marginY, setMarginY] = useState(20)
  const [customX, setCustomX] = useState(50)
  const [customY, setCustomY] = useState(50)
  const [useCustomPosition, setUseCustomPosition] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const watermarkImageInputRef = useRef<HTMLInputElement>(null)

  const canvasOps = useCanvasOperations()
  const formatConverter = useFormatConverter()
  const { startMonitoring, endMonitoring, getMetrics } = usePerformanceMonitor()

  const fontFamilies = [
    'Arial', 'Helvetica', 'Times New Roman', 'Courier New',
    'Georgia', 'Verdana', 'Comic Sans MS', 'Impact',
    'Trebuchet MS', 'Tahoma', 'Lucida Console'
  ]

  const watermarkPresets: WatermarkPreset[] = [
    {
      name: 'Copyright',
      type: 'text',
      content: '© 2024 Your Company',
      style: {
        fontSize: 16,
        fontFamily: 'Arial',
        color: '#ffffff',
        opacity: 0.6
      },
      position: 'bottom-left'
    },
    {
      name: 'Confidential',
      type: 'text',
      content: 'CONFIDENTIAL',
      style: {
        fontSize: 48,
        fontFamily: 'Arial Black',
        color: '#ff0000',
        opacity: 0.3
      },
      position: 'center'
    },
    {
      name: 'Sample',
      type: 'text',
      content: 'SAMPLE',
      style: {
        fontSize: 72,
        fontFamily: 'Impact',
        color: '#000000',
        opacity: 0.4
      },
      position: 'center'
    },
    {
      name: 'Draft',
      type: 'text',
      content: 'DRAFT',
      style: {
        fontSize: 60,
        fontFamily: 'Arial Black',
        color: '#808080',
        opacity: 0.5
      },
      position: 'center'
    }
  ]

  const positions: WatermarkPosition[] = [
    'top-left', 'top-center', 'top-right',
    'middle-left', 'center', 'middle-right',
    'bottom-left', 'bottom-center', 'bottom-right',
    'custom'
  ]

  const addLogEntry = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setProcessingLog(prev => `[${timestamp}] ${message}`)
  }, [])

  const handleFileUpload = useCallback((files: FileList | null) => {
    if (!files) return

    const validFiles = Array.from(files).filter(file => {
      if (!acceptedFormats.includes(file.type)) {
        setError(`Unsupported file type: ${file.type}`)
        return false
      }
      if (file.size > maxFileSize) {
        setError(`File too large: ${(file.size / 1024 / 1024).toFixed(1)}MB`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    setError(null)
    setIsProcessing(true)

    Promise.all(
      validFiles.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => resolve(e.target?.result as string)
          reader.readAsDataURL(file)
        })
      })
    ).then(imageDataArray => {
      setImages(validFiles)
      setOriginalImageData(imageDataArray)
      setWatermarkedImageData([])
      setCurrentImageIndex(0)
      setIsProcessing(false)
      addLogEntry(`Loaded ${validFiles.length} image(s) for watermarking`)
    }).catch(error => {
      setError('Failed to load images')
      setIsProcessing(false)
    })
  }, [acceptedFormats, maxFileSize, addLogEntry])

  const handleWatermarkImageUpload = useCallback((file: File) => {
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file')
      return
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const url = e.target?.result as string
      setWatermarkImageUrl(url)
      setWatermarkImage(file)
      addLogEntry(`Watermark image loaded: ${file.name}`)
    }
    reader.readAsDataURL(file)
  }, [addLogEntry])

  const addWatermark = useCallback(() => {
    const watermark: Watermark = {
      id: Date.now().toString(),
      type: watermarkImage ? 'image' : 'text',
      content: watermarkImage ? watermarkImageUrl : text,
      position: useCustomPosition ? 'custom' : position,
      x: useCustomPosition ? customX : undefined,
      y: useCustomPosition ? customY : undefined,
      marginX,
      marginY,
      opacity,
      rotation,
      style: {
        fontSize,
        fontFamily,
        fontWeight,
        fontStyle,
        color: textColor,
        backgroundColor: useBackground ? backgroundColor : undefined,
        padding,
        imageOpacity,
        imageScale,
        tileMode,
        tileSpacing
      }
    }

    setWatermarks(prev => [...prev, watermark])
    setSelectedWatermarkIndex(watermarks.length)
    addLogEntry(`Added ${watermark.type} watermark`)
  }, [
    watermarkImage, watermarkImageUrl, text, position, useCustomPosition,
    customX, customY, marginX, marginY, opacity, rotation, fontSize,
    fontFamily, fontWeight, fontStyle, textColor, backgroundColor,
    useBackground, padding, imageOpacity, imageScale, tileMode, tileSpacing,
    watermarks.length, addLogEntry
  ])

  const updateWatermark = useCallback((index: number, updates: Partial<Watermark>) => {
    setWatermarks(prev => prev.map((w, i) =>
      i === index ? { ...w, ...updates } : w
    ))
    addLogEntry(`Updated watermark ${index + 1}`)
  }, [addLogEntry])

  const removeWatermark = useCallback((index: number) => {
    setWatermarks(prev => prev.filter((_, i) => i !== index))
    if (selectedWatermarkIndex === index) {
      setSelectedWatermarkIndex(null)
    } else if (selectedWatermarkIndex !== null && selectedWatermarkIndex > index) {
      setSelectedWatermarkIndex(prev => prev! - 1)
    }
    addLogEntry(`Removed watermark ${index + 1}`)
  }, [selectedWatermarkIndex, addLogEntry])

  const moveWatermark = useCallback((index: number, direction: 'up' | 'down') => {
    setWatermarks(prev => {
      const newWatermarks = [...prev]
      const targetIndex = direction === 'up' ? index - 1 : index + 1

      if (targetIndex >= 0 && targetIndex < prev.length) {
        [newWatermarks[index], newWatermarks[targetIndex]] =
        [newWatermarks[targetIndex], newWatermarks[index]]
      }

      return newWatermarks
    })

    if (selectedWatermarkIndex === index) {
      setSelectedWatermarkIndex(direction === 'up' ? index - 1 : index + 1)
    }

    addLogEntry(`Moved watermark ${index + 1} ${direction}`)
  }, [selectedWatermarkIndex, addLogEntry])

  const applyPreset = useCallback((preset: WatermarkPreset) => {
    setText(preset.content)
    setFontSize(preset.style.fontSize)
    setFontFamily(preset.style.fontFamily)
    setTextColor(preset.style.color)
    setOpacity(preset.style.opacity)
    setPosition(preset.position)
    setUseBackground(false)
    setBackgroundColor('#000000')
    addLogEntry(`Applied preset: ${preset.name}`)
  }, [addLogEntry])

  const applyWatermarks = useCallback(async () => {
    if (originalImageData.length === 0) return

    setIsProcessing(true)
    startMonitoring('apply-watermarks')
    setProgress(0)

    try {
      const results = await Promise.all(
        originalImageData.map(async (imageData, index) => {
          addLogEntry(`Processing image ${index + 1}/${originalImageData.length}: ${images[index].name}`)
          setProgress((index / originalImageData.length) * 100)

          return await canvasOps.applyWatermarks(imageData, watermarks)
        })
      )

      // Convert to files and generate preview URLs
      const files = await Promise.all(
        results.map(async (canvas, index) => {
          return new Promise<File>((resolve) => {
            canvas.toBlob((blob) => {
              if (blob) {
                const file = new File([blob], `watermarked_${images[index].name}`, {
                  type: blob.type,
                  lastModified: Date.now()
                })
                resolve(file)
              }
            }, images[index].type || 'image/png')
          })
        })
      )

      // Generate preview URLs
      const previewUrls = await Promise.all(
        results.map(canvas => {
          return new Promise<string>((resolve) => {
            resolve(canvas.toDataURL('image/png'))
          })
        })
      )

      setWatermarkedImageData(previewUrls)

      const metrics = getMetrics()
      addLogEntry(`Successfully applied ${watermarks.length} watermark(s) to ${results.length} image(s) (${metrics.executionTime.toFixed(2)}ms)`)

      if (onComplete) {
        onComplete(files)
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to apply watermarks')
      addLogEntry(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      endMonitoring()
      setIsProcessing(false)
      setProgress(0)
    }
  }, [originalImageData, images, watermarks, canvasOps, startMonitoring, endMonitoring, getMetrics, addLogEntry, onComplete])

  const downloadWatermarkedImage = useCallback((index?: number) => {
    const downloadFile = (url: string, fileName: string) => {
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      addLogEntry(`Downloaded: ${fileName}`)
    }

    if (index !== undefined && watermarkedImageData[index]) {
      downloadFile(watermarkedImageData[index], `watermarked_${images[index].name}`)
    } else if (watermarkedImageData.length > 0) {
      watermarkedImageData.forEach((url, i) => {
        setTimeout(() => {
          downloadFile(url, `watermarked_${images[i].name}`)
        }, i * 100)
      })
    }
  }, [watermarkedImageData, images, addLogEntry])

  // Preview canvas
  useEffect(() => {
    if (!previewMode || originalImageData.length === 0 || !canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const img = new Image()
    img.onload = async () => {
      canvas.width = img.width
      canvas.height = img.height

      // Clear and draw original image
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)

      // Apply watermarks for preview
      if (watermarks.length > 0) {
        const tempCanvas = await canvasOps.applyWatermarks(canvas.toDataURL(), watermarks)
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(tempCanvas, 0, 0)
      }
    }
    img.src = originalImageData[currentImageIndex]
  }, [previewMode, originalImageData, currentImageIndex, watermarks, canvasOps])

  const selectedWatermark = selectedWatermarkIndex !== null ? watermarks[selectedWatermarkIndex] : null

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            Watermark Adder
          </CardTitle>
          <CardDescription>
            Add text or image watermarks with precise positioning and styling
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Upload Section */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={acceptedFormats.join(',')}
                onChange={(e) => handleFileUpload(e.target.files)}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                disabled={isProcessing}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Images
              </Button>
              <p className="text-sm text-gray-500 mt-2">
                Max: {(maxFileSize / 1024 / 1024).toFixed(1)}MB per file
              </p>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {images.length > 0 && (
              <Tabs defaultValue="watermark" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="watermark">Watermark</TabsTrigger>
                  <TabsTrigger value="style">Style</TabsTrigger>
                  <TabsTrigger value="position">Position</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>

                <TabsContent value="watermark" className="space-y-6">
                  {/* Watermark Type Selection */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="text-sm font-medium">Text Watermark</div>

                      <div>
                        <Label className="text-sm">Text</Label>
                        <Textarea
                          value={text}
                          onChange={(e) => setText(e.target.value)}
                          placeholder="Enter watermark text..."
                          className="mt-1"
                          rows={3}
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm">Font Family</Label>
                          <Select value={fontFamily} onValueChange={setFontFamily}>
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {fontFamilies.map(font => (
                                <SelectItem key={font} value={font}>{font}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label className="text-sm">Font Weight</Label>
                          <Select value={fontWeight} onValueChange={(value: any) => setFontWeight(value)}>
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="bold">Bold</SelectItem>
                              <SelectItem value="lighter">Lighter</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm">Font Size: {fontSize}px</Label>
                          <Slider
                            value={[fontSize]}
                            onValueChange={(value) => setFontSize(value[0])}
                            min={8}
                            max={200}
                            step={1}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-sm">Padding: {padding}px</Label>
                          <Slider
                            value={[padding]}
                            onValueChange={(value) => setPadding(value[0])}
                            min={0}
                            max={50}
                            step={1}
                            className="mt-1"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm">Text Color</Label>
                          <div className="flex items-center gap-2 mt-1">
                            <input
                              type="color"
                              value={textColor}
                              onChange={(e) => setTextColor(e.target.value)}
                              className="w-full h-10 border rounded"
                            />
                            <Input
                              value={textColor}
                              onChange={(e) => setTextColor(e.target.value)}
                              className="w-24"
                              placeholder="#ffffff"
                            />
                          </div>
                        </div>

                        <div>
                          <Label className="text-sm">Font Style</Label>
                          <Select value={fontStyle} onValueChange={(value: any) => setFontStyle(value)}>
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="italic">Italic</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm">Background Color</Label>
                          <Switch
                            checked={useBackground}
                            onCheckedChange={setUseBackground}
                          />
                        </div>
                        {useBackground && (
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={backgroundColor}
                              onChange={(e) => setBackgroundColor(e.target.value)}
                              className="w-full h-10 border rounded"
                            />
                            <Input
                              value={backgroundColor}
                              onChange={(e) => setBackgroundColor(e.target.value)}
                              className="w-24"
                              placeholder="#000000"
                            />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="text-sm font-medium">Image Watermark</div>

                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                        <input
                          ref={watermarkImageInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => e.target.files?.[0] && handleWatermarkImageUpload(e.target.files[0])}
                          className="hidden"
                        />
                        <Button
                          onClick={() => watermarkImageInputRef.current?.click()}
                          variant="outline"
                          size="sm"
                        >
                          <ImageIcon className="h-4 w-4 mr-2" />
                          Upload Watermark Image
                        </Button>

                        {watermarkImage && (
                          <div className="mt-2">
                            <div className="text-sm text-gray-600">{watermarkImage.name}</div>
                            {watermarkImageUrl && (
                              <img
                                src={watermarkImageUrl}
                                alt="Watermark preview"
                                className="w-16 h-16 mx-auto mt-2 object-cover border rounded"
                              />
                            )}
                          </div>
                        )}
                      </div>

                      {watermarkImage && (
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label className="text-sm">Image Opacity: {Math.round(imageOpacity * 100)}%</Label>
                              <Slider
                                value={[imageOpacity]}
                                onValueChange={(value) => setImageOpacity(value[0])}
                                min={0}
                                max={1}
                                step={0.1}
                                className="mt-1"
                              />
                            </div>

                            <div>
                              <Label className="text-sm">Image Scale: {Math.round(imageScale * 100)}%</Label>
                              <Slider
                                value={[imageScale]}
                                onValueChange={(value) => setImageScale(value[0])}
                                min={0.05}
                                max={1}
                                step={0.05}
                                className="mt-1"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm">Tile Mode</Label>
                              <Switch
                                checked={tileMode}
                                onCheckedChange={setTileMode}
                              />
                            </div>

                            {tileMode && (
                              <div>
                                <Label className="text-sm">Tile Spacing: {tileSpacing}px</Label>
                                <Slider
                                  value={[tileSpacing]}
                                  onValueChange={(value) => setTileSpacing(value[0])}
                                  min={0}
                                  max={200}
                                  step={10}
                                  className="mt-1"
                                />
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="space-y-4">
                        <div className="text-sm font-medium">Presets</div>
                        <div className="grid grid-cols-2 gap-2">
                          {watermarkPresets.map((preset) => (
                            <Button
                              key={preset.name}
                              variant="outline"
                              size="sm"
                              onClick={() => applyPreset(preset)}
                              className="text-xs"
                            >
                              {preset.name}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      onClick={addWatermark}
                      disabled={(!text && !watermarkImage) || isProcessing}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add Watermark
                    </Button>
                  </div>

                  {/* Watermark List */}
                  {watermarks.length > 0 && (
                    <div className="space-y-4">
                      <div className="text-sm font-medium">Active Watermarks ({watermarks.length})</div>
                      <div className="space-y-2">
                        {watermarks.map((watermark, index) => (
                          <div
                            key={watermark.id}
                            className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedWatermarkIndex === index ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                            }`}
                            onClick={() => setSelectedWatermarkIndex(index)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <Badge variant="outline" className="text-xs">
                                  {watermark.type}
                                </Badge>
                                <span className="text-sm font-medium">
                                  {index + 1}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600">
                                {watermark.type === 'text'
                                  ? (watermark.content || '').substring(0, 30) + '...'
                                  : 'Image watermark'
                                }
                              </div>
                            </div>

                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  moveWatermark(index, 'up')
                                }}
                                disabled={index === 0}
                              >
                                <Plus className="h-3 w-3 rotate-180" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  moveWatermark(index, 'down')
                                }}
                                disabled={index === watermarks.length - 1}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  removeWatermark(index)
                                }}
                              >
                                ×
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="style" className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm">Opacity: {Math.round(opacity * 100)}%</Label>
                        <Slider
                          value={[opacity]}
                          onValueChange={(value) => {
                            setOpacity(value[0])
                            if (selectedWatermarkIndex !== null) {
                              updateWatermark(selectedWatermarkIndex, { opacity: value[0] })
                            }
                          }}
                          min={0}
                          max={1}
                          step={0.1}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-sm">Rotation: {rotation}°</Label>
                        <Slider
                          value={[rotation]}
                          onValueChange={(value) => {
                            setRotation(value[0])
                            if (selectedWatermarkIndex !== null) {
                              updateWatermark(selectedWatermarkIndex, { rotation: value[0] })
                            }
                          }}
                          min={-180}
                          max={180}
                          step={5}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm">Preview</Label>
                        <div className="flex items-center gap-2 mt-1">
                          <Button
                            variant={previewMode ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPreviewMode(true)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Show
                          </Button>
                          <Button
                            variant={!previewMode ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPreviewMode(false)}
                          >
                            <EyeOff className="h-4 w-4 mr-2" />
                            Hide
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="position" className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-sm">Position</Label>
                        <div className="grid grid-cols-3 gap-2 mt-2">
                          {positions.map((pos) => (
                            <Button
                              key={pos}
                              variant={position === pos && !useCustomPosition ? "default" : "outline"}
                              size="sm"
                              onClick={() => {
                                setPosition(pos)
                                setUseCustomPosition(pos === 'custom')
                                if (selectedWatermarkIndex !== null) {
                                  updateWatermark(selectedWatermarkIndex, {
                                    position: pos,
                                    x: pos === 'custom' ? customX : undefined,
                                    y: pos === 'custom' ? customY : undefined
                                  })
                                }
                              }}
                              className="text-xs"
                            >
                              {pos.replace('-', ' ')}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm">Margin X: {marginX}px</Label>
                          <Slider
                            value={[marginX]}
                            onValueChange={(value) => {
                              setMarginX(value[0])
                              if (selectedWatermarkIndex !== null) {
                                updateWatermark(selectedWatermarkIndex, { marginX: value[0] })
                              }
                            }}
                            min={0}
                            max={100}
                            step={5}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label className="text-sm">Margin Y: {marginY}px</Label>
                          <Slider
                            value={[marginY]}
                            onValueChange={(value) => {
                              setMarginY(value[0])
                              if (selectedWatermarkIndex !== null) {
                                updateWatermark(selectedWatermarkIndex, { marginY: value[0] })
                              }
                            }}
                            min={0}
                            max={100}
                            step={5}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      {useCustomPosition && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label className="text-sm">X Position: {customX}%</Label>
                            <Slider
                              value={[customX]}
                              onValueChange={(value) => {
                                setCustomX(value[0])
                                if (selectedWatermarkIndex !== null) {
                                  updateWatermark(selectedWatermarkIndex, { x: value[0] })
                                }
                              }}
                              min={0}
                              max={100}
                              step={1}
                              className="mt-1"
                            />
                          </div>

                          <div>
                            <Label className="text-sm">Y Position: {customY}%</Label>
                            <Slider
                              value={[customY]}
                              onValueChange={(value) => {
                                setCustomY(value[0])
                                if (selectedWatermarkIndex !== null) {
                                  updateWatermark(selectedWatermarkIndex, { y: value[0] })
                                }
                              }}
                              min={0}
                              max={100}
                              step={1}
                              className="mt-1"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="preview" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">
                        Image {currentImageIndex + 1} of {images.length}
                      </Label>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCurrentImageIndex(Math.max(0, currentImageIndex - 1))}
                          disabled={currentImageIndex === 0}
                        >
                          Previous
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCurrentImageIndex(Math.min(images.length - 1, currentImageIndex + 1))}
                          disabled={currentImageIndex === images.length - 1}
                        >
                          Next
                        </Button>
                      </div>
                    </div>

                    <div className="border rounded-lg overflow-hidden bg-gray-100 p-4">
                      <canvas
                        ref={canvasRef}
                        className="w-full h-auto mx-auto"
                        style={{ maxWidth: '100%' }}
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button
                        onClick={applyWatermarks}
                        disabled={isProcessing || watermarks.length === 0}
                        className="flex-1"
                      >
                        {isProcessing ? (
                          <>
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Settings className="h-4 w-4 mr-2" />
                            Apply Watermarks
                          </>
                        )}
                      </Button>
                    </div>

                    {isProcessing && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Processing...</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} />
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>

              {/* Results Gallery */}
              {watermarkedImageData.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Watermarked Images</Label>
                    <Button
                      onClick={() => downloadWatermarkedImage()}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Download All
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {watermarkedImageData.map((url, index) => (
                      <div
                        key={index}
                        className={`border rounded-lg overflow-hidden cursor-pointer transition-colors ${
                          index === currentImageIndex ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setCurrentImageIndex(index)}
                      >
                        <img
                          src={url}
                          alt={`Watermarked ${index + 1}`}
                          className="w-full h-24 object-cover"
                        />
                        <div className="p-2">
                          <div className="text-xs text-gray-600 truncate">
                            {images[index]?.name || `Image ${index + 1}`}
                          </div>
                          <div className="text-xs text-gray-400">
                            {images[index] ? `${(images[index].size / 1024).toFixed(1)}KB` : ''}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            )}

            {/* Processing Log */}
            {processingLog.length > 0 && (
              <div className="mt-4">
                <Label className="text-sm font-medium">Processing Log</Label>
                <div className="mt-1 text-xs font-mono bg-gray-100 p-2 rounded max-h-20 overflow-y-auto">
                  {processingLog.slice(-5).join('\n')}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
