# PP-OCRv6 Tiny ONNX Models

This directory should contain the ONNX-exported PP-OCRv6 Tiny models:

- `det.onnx` — Text detection model (DBNet)
- `cls.onnx` — Text direction classification model
- `rec.onnx` — Text recognition model (SVTR-LCNet + CTC)

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
