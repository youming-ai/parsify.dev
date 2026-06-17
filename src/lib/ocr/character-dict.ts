/**
 * PP-OCR character dictionary (ppocr_keys_v1.txt).
 * Index 0 = blank token for CTC decoding.
 * Full dictionary: ~6628 characters (Chinese, English, symbols).
 *
 * For production, load the full dictionary from a static file.
 * This is a representative subset for testing.
 */
export const CHARACTER_DICT: string[] = [
  '', // 0: blank
  ' ',
  '!',
  '"',
  '#',
  '$',
  '%',
  '&',
  "'",
  '(',
  ')',
  '*',
  '+',
  ',',
  '-',
  '.',
  '/',
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  ':',
  ';',
  '<',
  '=',
  '>',
  '?',
  '@',
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G',
  'H',
  'I',
  'J',
  'K',
  'L',
  'M',
  'N',
  'O',
  'P',
  'Q',
  'R',
  'S',
  'T',
  'U',
  'V',
  'W',
  'X',
  'Y',
  'Z',
  '[',
  '\\',
  ']',
  '^',
  '_',
  '`',
  'a',
  'b',
  'c',
  'd',
  'e',
  'f',
  'g',
  'h',
  'i',
  'j',
  'k',
  'l',
  'm',
  'n',
  'o',
  'p',
  'q',
  'r',
  's',
  't',
  'u',
  'v',
  'w',
  'x',
  'y',
  'z',
  '{',
  '|',
  '}',
  '~',
  // Chinese characters (representative subset — full dict has ~6500 more)
  '的',
  '一',
  '是',
  '不',
  '了',
  '人',
  '我',
  '在',
  '有',
  '他',
  '这',
  '为',
  '之',
  '大',
  '来',
  '以',
  '个',
  '中',
  '上',
  '们',
  '到',
  '说',
  '国',
  '和',
  '地',
  '也',
  '子',
  '时',
  '道',
  '出',
  '会',
  '三',
  '要',
  '于',
  '下',
  '得',
  '可',
  '你',
  '年',
  '生',
  '学',
  '对',
  '所',
  '自',
  '家',
  '之',
  '发',
  '成',
  '方',
  '多',
  '么',
  '去',
  '然',
  '经',
  '过',
  '法',
  '当',
  '起',
  '与',
  '好',
  '看',
  '定',
  '天',
  '明',
  '问',
  '同',
  '开',
  '从',
  '全',
  '长',
  '用',
  '世',
  '间',
  '日',
  '最',
  '新',
  '又',
  '其',
  '如',
  '行',
];

/**
 * Load the full PP-OCR character dictionary from a static file.
 * Falls back to the embedded subset if the file is missing or invalid.
 *
 * Dev/SPA servers answer 200 with index.html for missing static files, so a
 * 200 response is not enough — we must reject HTML and implausibly short
 * payloads, otherwise CTC decoding would index into garbage "characters".
 */
export async function loadFullDictionary(baseUrl = '/models/pp-ocrv6-tiny'): Promise<string[]> {
  try {
    const response = await fetch(`${baseUrl}/ppocrv6_tiny_dict.txt`);
    if (!response.ok) return CHARACTER_DICT;

    const contentType = response.headers.get('content-type') ?? '';
    const text = await response.text();
    if (contentType.includes('text/html') || /^\s*<(?:!doctype|html)/i.test(text)) {
      return CHARACTER_DICT;
    }

    // Match PaddleOCR's CTCLabelDecode exactly: each line is one character
    // entry kept verbatim (including the full-width space at U+3000); only the
    // trailing newline is dropped — internal blank lines, if any, are real
    // entries and must NOT be filtered, or every later index would shift.
    // CTC blank occupies index 0; the half-width space is appended last.
    const lines = text.replace(/\r\n/g, '\n').split('\n');
    if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();

    // A real PP-OCR dictionary has thousands of single-character entries; a
    // handful of lines means we fetched something that isn't a dictionary.
    if (lines.length < 100) return CHARACTER_DICT;

    return ['', ...lines, ' '];
  } catch {
    return CHARACTER_DICT;
  }
}
