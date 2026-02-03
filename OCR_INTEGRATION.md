# 📸 OCR Integration - Multi-Provider Text Extraction

## Overview

TypeFlow AI now supports **three OCR providers** for extracting text from images in PDF files:

1. **Tesseract.js** - FREE, local processing, good accuracy
2. **Gemini Vision** - FREE cloud API, excellent accuracy (15 RPM)
3. **OpenAI Vision** - Paid cloud API, highest accuracy

This means your AI can learn from:
- 📄 Scanned documents
- 📊 Charts and graphs with labels
- 🖼️ Images with text overlays
- 📸 Screenshots
- 📋 Forms and tables
- 🎨 Infographics

## Configuration

### Environment Variables

```env
# Choose OCR provider: 'tesseract', 'gemini', or 'openai'
OCR_PROVIDER=gemini

# Required for Gemini OCR
GEMINI_API_KEY=your_gemini_key

# Required for OpenAI OCR
OPENAI_API_KEY=your_openai_key
```

### Provider Selection Logic

The system automatically selects the best available provider:

```typescript
// Priority: Configured provider → Fallback to Tesseract
const provider = process.env.OCR_PROVIDER || 'tesseract'
if (provider === 'gemini' && GEMINI_API_KEY) return 'gemini'
if (provider === 'openai' && OPENAI_API_KEY) return 'openai'
return 'tesseract' // Always available
```

## OCR Provider Comparison

| Feature | Tesseract.js | Gemini Vision | OpenAI Vision |
|---------|-------------|---------------|---------------|
| **Cost** | FREE | FREE (15 RPM) | Paid ($0.01/image) |
| **Location** | Local | Cloud | Cloud |
| **Accuracy** | Good (85-95%) | Excellent (95-99%) | Excellent (95-99%) |
| **Speed** | Medium | Fast | Fast |
| **Languages** | 100+ | 50+ | Multi-language |
| **Setup** | None | API key | API key |
| **Offline** | ✅ Yes | ❌ No | ❌ No |
| **Best For** | Simple text | General use | Highest accuracy |

## How It Works

```
PDF Upload
    │
    ├──> Extract Regular Text (pdf-parse)
    │    ├─ Selectable text
    │    └─ Native PDF text content
    │
    └──> Extract Images (pdfjs-dist)
         ├─ Detect embedded images
         ├─ Extract image data
         └─ Perform OCR (Selected Provider)
              ├─ Tesseract: Local processing
              ├─ Gemini: Cloud API call
              ├─ OpenAI: Vision API call
              └─ Combine with PDF text
```

## Features

### ✅ Automatic Detection
- Scans all pages in uploaded PDFs
- Detects embedded images automatically
- No configuration needed

### ✅ Smart Text Extraction
- Extracts text from images using OCR
- Preserves image context (page number, image number)
- Filters out low-quality results (< 10 characters)

### ✅ Comprehensive Training
- Combines native PDF text + OCR text
- Creates more complete knowledge base
- Better autocomplete suggestions from visual content

### ✅ Progress Tracking
- Real-time OCR progress logging
- Shows images processed per page
- Reports characters extracted

## API Response

When training with PDFs containing images, the response includes OCR statistics:

```json
{
  "success": true,
  "message": "Successfully processed 150 chunks",
  "chunks": 150,
  "filename": "document.pdf",
  "processingTime": 12500,
  "ocr": {
    "imagesProcessed": 5,
    "charactersExtracted": 850,
    "provider": "gemini"
  }
}
```

## UI Indicators

### OCR Provider Badge
Located in the Training tab header:
- **Purple badge**: "OCR: Tesseract.js (FREE)"
- **Blue badge**: "OCR: Gemini Vision (FREE)"
- **Green badge**: "OCR: OpenAI Vision (Paid)"

### Success Notification
After successful training:
- **Standard**: "document.pdf: 150 chunks processed in 12s"
- **With OCR**: "document.pdf: 150 chunks processed in 12s (+ 5 images via GEMINI OCR)"

## Example Use Cases

### 1. **Scanned Documents**
```
Input: PDF scan of a business report
Result: AI learns both typed text and handwritten notes
```

### 2. **Technical Diagrams**
```
Input: Architecture diagrams with labels
Result: AI understands technical terms from diagram text
```

### 3. **Screenshots**
```
Input: PDF with software UI screenshots
Result: AI learns button labels, menu items, error messages
```

### 4. **Mixed Content**
```
Input: PDF with regular text + embedded charts
Result: AI combines document content + chart labels
```

## Performance

### Processing Time
- **Regular PDF text**: ~1-2 seconds
- **OCR per image**: ~2-5 seconds
- **Total**: Depends on image count and complexity

Example timing:
```
PDF: 10 pages, 3 images
├─ Text extraction: 1.5s
└─ OCR (3 images): 10s
Total: ~11.5s
```

### Image Detection
- ✅ Embedded PNG images
- ✅ Embedded JPEG images
- ✅ Inline images
- ⚠️ Vector graphics (no text to extract)
- ⚠️ Background images (may have low accuracy)

## OCR Quality

### High Accuracy
- ✅ Clear, high-resolution text
- ✅ Good contrast (dark text on light background)
- ✅ Standard fonts
- ✅ Horizontal text

### Lower Accuracy
- ⚠️ Low resolution images
- ⚠️ Poor contrast
- ⚠️ Handwriting
- ⚠️ Rotated text
- ⚠️ Complex backgrounds

## Code Implementation

### OCR Service (`lib/ocr.ts`)

```typescript
export interface OCRResult {
  text: string
  imagesProcessed: number
  charactersExtracted: number
}

export async function extractTextFromPDFImages(
  pdfBuffer: Buffer
): Promise<OCRResult> {
  // 1. Load PDF with pdf.js
  const pdfDocument = await pdfjsLib.getDocument(data).promise
  
  // 2. Iterate through pages
  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDocument.getPage(pageNum)
    const operatorList = await page.getOperatorList()
    
    // 3. Find image operations
    for (const op of operatorList.fnArray) {
      if (op === 85 || op === 86) { // Paint image ops
        // 4. Extract image data
        const imageData = await page.objs.get(imageName)
        
        // 5. Perform OCR
        const ocrText = await extractTextFromImage(imageData)
        
        // 6. Accumulate results
        allOcrText += ocrText
      }
    }
  }
  
  return { text, imagesProcessed, charactersExtracted }
}
```

### Training Integration (`app/api/train/route.ts`)

```typescript
// Extract regular text
const data = await pdf(buffer)
let extractedText = data.text

// Extract OCR text from images
const ocrResult = await extractTextFromPDFImages(buffer)

// Combine both
if (ocrResult.text.length > 0) {
  extractedText += '\n\n' + ocrResult.text
}

// Return stats
return NextResponse.json({
  success: true,
  chunks: insertedChunks.length,
  ocr: {
    imagesProcessed: ocrResult.imagesProcessed,
    charactersExtracted: ocrResult.charactersExtracted
  }
})
```

## Language Support

Currently configured for **English** only:

```typescript
await Tesseract.recognize(
  imageBuffer,
  'eng', // English
  { logger: (m) => console.log(m.progress) }
)
```

### Adding More Languages

To support multiple languages, modify `lib/ocr.ts`:

```typescript
// Spanish + English
await Tesseract.recognize(imageBuffer, 'spa+eng')

// Chinese + English
await Tesseract.recognize(imageBuffer, 'chi_sim+eng')

// French + German + English
await Tesseract.recognize(imageBuffer, 'fra+deu+eng')
```

Available language codes:
- `eng` - English
- `spa` - Spanish
- `fra` - French
- `deu` - German
- `chi_sim` - Chinese Simplified
- `chi_tra` - Chinese Traditional
- `jpn` - Japanese
- `kor` - Korean
- `ara` - Arabic
- `rus` - Russian
- [100+ more languages supported](https://tesseract-ocr.github.io/tessdoc/Data-Files#data-files-for-version-400-november-29-2016)

## Limitations

### Current Limitations
1. **English Only**: Configured for English language recognition
2. **Processing Time**: OCR adds 2-5 seconds per image
3. **Server-Side Only**: OCR runs on server, not in browser
4. **Quality Dependent**: Accuracy varies with image quality

### Future Enhancements
- [ ] Multi-language support (user-selectable)
- [ ] Parallel OCR processing for multiple images
- [ ] Image preprocessing (contrast enhancement, deskewing)
- [ ] OCR confidence scores
- [ ] Support for handwriting recognition
- [ ] Table structure recognition
- [ ] Layout analysis (columns, sections)

## Troubleshooting

### "No text extracted from images"

**Possible causes:**
1. PDF contains no embedded images
2. Images are vector graphics (not raster)
3. Images contain no text
4. Text is too small or blurry

**Solution:**
- Check PDF manually for images
- Verify images contain readable text
- Try higher resolution PDF

### OCR Taking Too Long

**Issue:** PDF with many images times out

**Solution:**
- Split PDF into smaller files
- Process fewer pages per upload
- Increase server timeout limits

### Low OCR Accuracy

**Issue:** Extracted text is garbled

**Possible causes:**
- Low resolution images
- Poor contrast
- Unusual fonts
- Rotated/skewed text

**Solution:**
- Re-scan document at higher DPI (300+ recommended)
- Improve source image quality
- Use PDFs with native text when possible

## Package Dependencies

```json
{
  "tesseract.js": "^7.0.0",
  "pdfjs-dist": "^4.x.x",
  "pdf-parse": "^1.1.1"
}
```

Install with:
```bash
npm install tesseract.js pdfjs-dist
```

## Console Logs

OCR operations are logged for debugging:

```
[Train] Extracting text from PDF...
[Train] Extracted 2500 characters from PDF text
[Train] Starting OCR on PDF images...
[OCR] Loading PDF document...
[OCR] PDF has 5 pages
[OCR] Processing page 1/5...
[OCR] Found image 1 on page 1
[OCR] Starting text recognition...
[OCR] Progress: 25%
[OCR] Progress: 50%
[OCR] Progress: 75%
[OCR] Progress: 100%
[OCR] Extracted 125 characters
[OCR] Processing page 2/5...
[OCR] No images found on page 2
...
[OCR] Completed! Processed 3 images total
[OCR] Total OCR text extracted: 450 characters
[Train] OCR extracted 450 characters from 3 images
[Train] Total extracted text: 2950 characters
```

## Performance Optimization

### Batch Processing
Process multiple PDFs sequentially to avoid memory issues:

```typescript
for (const file of files) {
  await trainWithFile(file) // Process one at a time
}
```

### Memory Management
Large PDFs with many images may consume significant memory. Monitor server resources.

### Caching
OCR results are not cached. Re-uploading the same PDF will re-process images.

## Security Considerations

- OCR runs server-side only
- Uploaded PDFs are stored in Supabase
- OCR text is stored alongside regular text
- No external OCR services used (all local processing)
- GDPR compliant (data stays on your infrastructure)

## Cost Implications

### Free & Local
- ✅ No API costs (unlike cloud OCR services)
- ✅ Tesseract.js is open-source and free
- ✅ Runs on your server

### Resource Usage
- ⚠️ CPU intensive (OCR processing)
- ⚠️ Memory usage increases with image count
- ⚠️ Longer processing times

**Recommendation:** For production, ensure adequate server resources for OCR workload.

## Comparison with Cloud OCR

| Feature | TypeFlow (Tesseract) | Google Cloud Vision | AWS Textract |
|---------|---------------------|---------------------|--------------|
| Cost | **FREE** | $1.50/1000 pages | $1.50/1000 pages |
| Privacy | **Local** | Cloud processed | Cloud processed |
| Languages | 100+ | 200+ | 100+ |
| Accuracy | Good (85-95%) | Excellent (95-99%) | Excellent (95-99%) |
| Speed | Medium | Fast | Fast |
| Setup | Simple | API key required | AWS account required |
| Offline | ✅ Yes | ❌ No | ❌ No |

## Summary

TypeFlow's OCR integration provides:

✅ **Automatic** - No configuration needed  
✅ **Free** - No API costs  
✅ **Private** - Local processing  
✅ **Effective** - Good accuracy for clear text  
✅ **Comprehensive** - Extracts all text sources  
✅ **Simple** - Just upload PDFs as before  

Your AI can now learn from scanned documents, screenshots, diagrams, and any PDF with embedded images! 🚀

## Getting Started

1. Upload any PDF with images
2. Watch the OCR progress in console logs
3. See OCR stats in success notification
4. Use autocomplete with text from images

No configuration required - OCR is enabled by default! 📸
