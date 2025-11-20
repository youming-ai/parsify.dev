/**
 * Image Processing Tools Index
 * Lazy-loaded exports for image processing tools
 */

export { ImageConverter } from "./image-converter";
export { ImageCropper } from "./image-cropper";
export { ImageResizer } from "./image-resizer";
export { QRCodeReader } from "./qr-code-reader";
export { ScreenshotTool } from "./screenshot-tool";
export { WatermarkAdder } from "./watermark-adder";

// Tool metadata for registry
export const imageToolsMetadata = [
  {
    id: "image-converter",
    name: "Image Converter",
    description: "Convert images between PNG, JPEG, WebP, and BMP formats with quality control",
    category: "image" as const,
    version: "1.0.0",
    bundleSize: 45000,
    loadTime: 0,
    dependencies: ["@/lib/image/format-converters", "@/lib/image/canvas-operations"],
    tags: ["image", "converter", "format", "png", "jpeg", "webp", "bmp"],
    enabled: true,
    priority: 2,
    icon: "image",
    author: "Parsify Team",
    license: "MIT",
  },
  {
    id: "image-cropper",
    name: "Image Cropper",
    description: "Crop images with precision controls, aspect ratios, and live preview",
    category: "image" as const,
    version: "1.0.0",
    bundleSize: 52000,
    loadTime: 0,
    dependencies: ["@/lib/image/canvas-operations"],
    tags: ["image", "crop", "aspect-ratio", "preview", "edit"],
    enabled: true,
    priority: 2,
    icon: "crop",
    author: "Parsify Team",
    license: "MIT",
  },
  {
    id: "image-resizer",
    name: "Image Resizer",
    description: "Resize images with quality preservation and intelligent scaling",
    category: "image" as const,
    version: "1.0.0",
    bundleSize: 48000,
    loadTime: 0,
    dependencies: ["@/lib/image/canvas-operations", "@/lib/image/format-converters"],
    tags: ["image", "resize", "scale", "quality", "dimensions"],
    enabled: true,
    priority: 2,
    icon: "maximize",
    author: "Parsify Team",
    license: "MIT",
  },
  {
    id: "qr-code-reader",
    name: "QR Code Reader",
    description: "Scan QR codes from images or camera with intelligent content detection",
    category: "image" as const,
    version: "1.0.0",
    bundleSize: 65000,
    loadTime: 0,
    dependencies: ["@/lib/image/qr-scanner", "qr-scanner"],
    tags: ["qr", "scanner", "camera", "barcode", "decode"],
    enabled: true,
    priority: 2,
    icon: "qrcode",
    author: "Parsify Team",
    license: "MIT",
  },
  {
    id: "screenshot-tool",
    name: "Screenshot Tool",
    description:
      "Capture screenshots from your screen, windows, or browser tabs with annotation support",
    category: "image" as const,
    version: "1.0.0",
    bundleSize: 38000,
    loadTime: 0,
    dependencies: ["@/lib/image/canvas-operations"],
    tags: ["screenshot", "capture", "screen", "annotation", "browser"],
    enabled: true,
    priority: 1,
    requiresBrowserAPI: true,
    icon: "camera",
    author: "Parsify Team",
    license: "MIT",
  },
  {
    id: "watermark-adder",
    name: "Watermark Adder",
    description: "Add text or image watermarks with precise positioning and styling",
    category: "image" as const,
    version: "1.0.0",
    bundleSize: 55000,
    loadTime: 0,
    dependencies: ["@/lib/image/canvas-operations"],
    tags: ["watermark", "text", "image", "branding", "protect"],
    enabled: true,
    priority: 2,
    icon: "layers",
    author: "Parsify Team",
    license: "MIT",
  },
];
