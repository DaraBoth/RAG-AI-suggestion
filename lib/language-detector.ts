/**
 * Detect the primary language of a text string
 * Returns the detected language code or 'unknown'
 */
export function detectLanguage(text: string): string {
  if (!text || text.trim().length === 0) return 'unknown'

  const trimmedText = text.trim().toLowerCase()
  
  // Get the last few words for more accurate detection
  const words = trimmedText.split(/\s+/)
  const lastWords = words.slice(-5).join(' ')
  
  // English detection
  const englishPatterns = /^[a-z\s.,!?'"]+$/i
  const commonEnglishWords = ['the', 'is', 'are', 'was', 'were', 'will', 'would', 'can', 'could', 'should', 'have', 'has', 'had', 'do', 'does', 'did', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'from', 'by']
  
  // Chinese detection (includes Simplified and Traditional)
  const chinesePattern = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/
  
  // Japanese detection (Hiragana, Katakana, Kanji)
  const japanesePattern = /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9faf]/
  
  // Korean detection (Hangul)
  const koreanPattern = /[\uac00-\ud7af\u1100-\u11ff\u3130-\u318f]/
  
  // Thai detection
  const thaiPattern = /[\u0e00-\u0e7f]/
  
  // Vietnamese detection (with diacritics)
  const vietnamesePattern = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i
  
  // Arabic detection
  const arabicPattern = /[\u0600-\u06ff\u0750-\u077f]/
  
  // Russian/Cyrillic detection
  const cyrillicPattern = /[\u0400-\u04ff]/
  
  // Spanish/Portuguese detection
  const spanishPattern = /[áéíóúüñ¿¡]/i
  
  // French detection
  const frenchPattern = /[àâæçéèêëïîôùûüÿœ]/i
  
  // German detection
  const germanPattern = /[äöüß]/i

  // Check patterns
  if (chinesePattern.test(lastWords)) return 'zh'
  if (japanesePattern.test(lastWords)) return 'ja'
  if (koreanPattern.test(lastWords)) return 'ko'
  if (thaiPattern.test(lastWords)) return 'th'
  if (vietnamesePattern.test(lastWords)) return 'vi'
  if (arabicPattern.test(lastWords)) return 'ar'
  if (cyrillicPattern.test(lastWords)) return 'ru'
  
  // Check European languages with special characters
  if (spanishPattern.test(lastWords)) return 'es'
  if (frenchPattern.test(lastWords)) return 'fr'
  if (germanPattern.test(lastWords)) return 'de'
  
  // English detection - check if text is primarily ASCII and contains common English words
  if (englishPatterns.test(lastWords)) {
    const hasCommonEnglishWord = words.some(word => 
      commonEnglishWords.includes(word.toLowerCase())
    )
    if (hasCommonEnglishWord) return 'en'
  }
  
  // Default to English for basic ASCII text
  if (englishPatterns.test(lastWords)) return 'en'
  
  return 'unknown'
}

/**
 * Get language name from code
 */
export function getLanguageName(code: string): string {
  const languages: Record<string, string> = {
    'en': 'English',
    'zh': 'Chinese',
    'ja': 'Japanese',
    'ko': 'Korean',
    'th': 'Thai',
    'vi': 'Vietnamese',
    'ar': 'Arabic',
    'ru': 'Russian',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'pt': 'Portuguese',
    'it': 'Italian',
    'unknown': 'Unknown'
  }
  return languages[code] || code.toUpperCase()
}

/**
 * Check if text matches the preferred language
 */
export function matchesPreferredLanguage(text: string, preferredLanguage: string): boolean {
  if (preferredLanguage === 'all' || !preferredLanguage) return true
  
  const detectedLanguage = detectLanguage(text)
  
  // If detection is uncertain, allow the request
  if (detectedLanguage === 'unknown') return true
  
  return detectedLanguage === preferredLanguage
}
