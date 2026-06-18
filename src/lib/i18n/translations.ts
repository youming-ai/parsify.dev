export type Lang = 'en' | 'zh';

// English is the source of truth for the key set; `zh` must mirror its keys.
const en = {
  'hero.eyebrow': 'OPTICAL CHARACTER RECOGNITION',
  'hero.headPre': 'EXTRACT TEXT FROM ANY',
  'hero.headWord': 'IMAGE',
  'hero.headPost': '',
  'hero.sub':
    'On-device OCR powered by PaddleOCR PP-OCRv6. Files stay in your browser; optional AI cleanup only sends extracted text when you request it.',

  'upload.idle': 'SCANNER · IDLE',
  'upload.drop': 'Drop an image to scan',
  'upload.hint': 'or paste from clipboard · click to browse',
  'upload.change': 'Change image',
  'upload.aria': 'Upload an image or PDF to scan',
  'upload.errFormat': 'Unsupported format. Please use PNG, JPEG, WebP, BMP, TIFF, or PDF.',
  'upload.errSize': 'File too large. Maximum size is {mb}MB.',
  'upload.truncated':
    'Only the first {rendered} of {total} pages were processed. The result is incomplete.',

  'spec.local.label': 'ON-DEVICE',
  'spec.local.desc': 'OCR runs in your browser. Files are never uploaded.',
  'spec.model.label': 'PP-OCRv6',
  'spec.model.desc': "PaddleOCR's latest models — tiny, fast, cached after first load.",
  'spec.scripts.label': '50+ SCRIPTS',
  'spec.scripts.desc': 'Chinese, English, Japanese and 46 Latin-script languages.',

  'progress.loading-models': 'Loading models',
  'progress.detecting': 'Detecting text',
  'progress.classifying': 'Classifying direction',
  'progress.recognizing': 'Recognizing text',
  'step.load': 'LOAD',
  'step.detect': 'DETECT',
  'step.classify': 'CLASSIFY',
  'step.recognize': 'RECOGNIZE',

  'source.title': 'SOURCE',
  'source.boxes': '{n} boxes',
  'source.showBoxes': 'Show detection boxes',
  'source.hideBoxes': 'Hide detection boxes',
  'source.zoomIn': 'Zoom in',
  'source.zoomOut': 'Zoom out',
  'source.zoomReset': 'Reset zoom',
  'source.prevPage': 'Previous page',
  'source.nextPage': 'Next page',

  'output.doc': 'DOCUMENT',
  'output.json': 'JSON',
  'output.lines': 'LINES · {n}',
  'output.ai': 'AI CLEANUP',
  'output.enhance': 'AI cleanup',
  'output.enhancing': 'Cleaning...',
  'output.streaming': 'streaming…',
  'output.aiWaiting': 'Waiting for response…',
  'output.aiError': 'AI ERROR',
  'output.noLines': 'No text lines recognized.',

  'common.copy': 'Copy',
  'common.copied': 'Copied!',
  'common.download': 'Download result',
  'common.error': 'ERROR',
  'error.ocrFailed': 'OCR processing failed',

  'footer.status': 'PP-OCRv6 · WASM · ON-DEVICE',
} as const;

export type TranslationKey = keyof typeof en;

const zh: Record<TranslationKey, string> = {
  'hero.eyebrow': '光学字符识别',
  'hero.headPre': '从任意',
  'hero.headWord': '图像',
  'hero.headPost': '中提取文字',
  'hero.sub':
    '基于 PaddleOCR PP-OCRv6 的本地 OCR。文件保留在浏览器中；只有当你主动请求 AI 整理时，才会发送提取后的文字。',

  'upload.idle': '扫描器 · 待机',
  'upload.drop': '拖入图片开始扫描',
  'upload.hint': '或从剪贴板粘贴 · 点击选择文件',
  'upload.change': '更换图片',
  'upload.aria': '上传图片或 PDF 进行扫描',
  'upload.errFormat': '不支持的格式。请使用 PNG、JPEG、WebP、BMP、TIFF 或 PDF。',
  'upload.errSize': '文件过大，最大 {mb}MB。',
  'upload.truncated': '仅处理了前 {rendered} 页（共 {total} 页），结果不完整。',

  'spec.local.label': '本地运行',
  'spec.local.desc': 'OCR 在浏览器中运行。文件绝不上传。',
  'spec.model.label': 'PP-OCRv6',
  'spec.model.desc': 'PaddleOCR 最新模型——小巧、快速，首次加载后缓存。',
  'spec.scripts.label': '50+ 种文字',
  'spec.scripts.desc': '中文、英文、日文及 46 种拉丁文字语言。',

  'progress.loading-models': '加载模型',
  'progress.detecting': '检测文字',
  'progress.classifying': '方向分类',
  'progress.recognizing': '识别文字',
  'step.load': '加载',
  'step.detect': '检测',
  'step.classify': '分类',
  'step.recognize': '识别',

  'source.title': '源文件',
  'source.boxes': '{n} 个文本框',
  'source.showBoxes': '显示检测框',
  'source.hideBoxes': '隐藏检测框',
  'source.zoomIn': '放大',
  'source.zoomOut': '缩小',
  'source.zoomReset': '重置缩放',
  'source.prevPage': '上一页',
  'source.nextPage': '下一页',

  'output.doc': '文档解析',
  'output.json': 'JSON',
  'output.lines': '逐行识别 · {n}',
  'output.ai': 'AI 整理',
  'output.enhance': 'AI 整理',
  'output.enhancing': '整理中...',
  'output.streaming': '生成中…',
  'output.aiWaiting': '等待响应…',
  'output.aiError': 'AI 错误',
  'output.noLines': '未识别到文本行。',

  'common.copy': '复制',
  'common.copied': '已复制！',
  'common.download': '下载结果',
  'common.error': '错误',
  'error.ocrFailed': 'OCR 处理失败',

  'footer.status': 'PP-OCRv6 · WASM · 本地运行',
};

export const translations: Record<Lang, Record<TranslationKey, string>> = { en, zh };

/** Translate a key for a language, with optional `{param}` interpolation. */
export function translate(
  lang: Lang,
  key: TranslationKey,
  params?: Record<string, string | number>
): string {
  let str = translations[lang][key] ?? translations.en[key] ?? key;
  if (params) {
    for (const [name, value] of Object.entries(params)) {
      str = str.split(`{${name}}`).join(String(value));
    }
  }
  return str;
}
