# PP-OCRv6 Tiny ONNX Models

This directory should contain the ONNX-exported PP-OCRv6 Tiny models:

- `det.onnx` — Text detection model (DBNet)
- `cls.onnx` — Text direction classification model (optional; tiny build omits it)
- `rec.onnx` — Text recognition model (SVTR-LCNet + CTC)
- `ppocrv6_tiny_dict.txt` — Character dictionary for CTC decoding (6904 entries).
  Must match the rec model: blank is prepended at index 0 and a space appended,
  giving 6906 classes. Source: PaddleOCR `ppocr/utils/dict/ppocrv6_tiny_dict.txt`.
  Note: this tiny dictionary is Chinese/kanji + Latin + symbols and contains **no
  Japanese kana**, so kana will not be recognized by this model.

## How to Obtain

Convert from PaddleOCR using paddle2onnx:

```bash
pip install paddle2onnx paddleocr

# Download PP-OCRv6 tiny models
paddleocr --lang ch --ocr_version PP-OCRv6 --use_gpu false

# Convert to ONNX
paddle2onnx \
  --model_dir ~/.paddleocr/whl/det/ch_PP-OCRv6_tiny_det \
  --model_filename inference.pdmodel \
  --params_filename inference.pdiparams \
  --save_file public/models/pp-ocrv6-tiny/det.onnx \
  --opset_version 11

paddle2onnx \
  --model_dir ~/.paddleocr/whl/cls/ch_PP-OCRv6_tiny_cls \
  --model_filename inference.pdmodel \
  --params_filename inference.pdiparams \
  --save_file public/models/pp-ocrv6-tiny/cls.onnx \
  --opset_version 11

paddle2onnx \
  --model_dir ~/.paddleocr/whl/rec/ch_PP-OCRv6_tiny_rec \
  --model_filename inference.pdmodel \
  --params_filename inference.pdiparams \
  --save_file public/models/pp-ocrv6-tiny/rec.onnx \
  --opset_version 11
```

Alternatively, download pre-converted models from HuggingFace:
https://huggingface.co/PaddlePaddle/PP-OCRv6

## Language support & adding Japanese (TODO — deferred 2026-06-17)

The current tiny model recognizes **Chinese / kanji, Latin, digits and symbols**
but **NOT Japanese kana** — `ppocrv6_tiny_dict.txt` has 6174 CJK ideographs and
zero hiragana/katakana, so kana-heavy Japanese text comes back partial. This is a
model/dictionary capability limit, not a bug.

To add Japanese, swap **only the recognition model + its dictionary** (`det.onnx`
and `cls.onnx` are language-agnostic and stay). The pipeline reads `numClasses`
from the rec output at runtime, so no decode-code changes are needed beyond the
dictionary path.

**Recommended: PP-OCRv5 mobile multilingual** (Chinese + Japanese + English + Latin in one model)
1. Download `ppocrv5_rec.onnx` (~16.6 MB) from HF `ilaylow/PP_OCRv5_mobile_onnx`
   and replace `rec.onnx`.
2. Download `ppocrv5_dict.txt` (18383 lines → 18385 classes, includes kana) from
   PaddleOCR `ppocr/utils/dict/ppocrv5_dict.txt` into this directory.
3. Point the loader at it: change the fetch path in
   `src/lib/ocr/character-dict.ts` (`loadFullDictionary`) to `ppocrv5_dict.txt`.
4. **Bump `DB_VERSION` in `src/lib/ocr/model-loader.ts`** so returning users'
   IndexedDB-cached old `rec` model is invalidated and the new one re-downloads.

**Alternative: Japanese-specific rec** — pair a `japan_*_rec.onnx` with
`japan_dict.txt` (4399 lines → 4401 classes). Smaller download, weaker on Chinese.

Compatibility: PP-OCRv5/v6 rec use input name `x`, image height 48, normalization
`(x/255 - 0.5)/0.5`, CTC blank at index 0 + trailing space — all already matched
by `preprocessor.ts` / `pipeline.ts`. Verify after swapping by running OCR on a
kana sample and confirming hiragana/katakana decode correctly.
