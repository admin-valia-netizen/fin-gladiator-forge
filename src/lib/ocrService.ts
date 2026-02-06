import Tesseract from 'tesseract.js';

export interface CedulaOCRResult {
  success: boolean;
  cedula?: string;
  rawText?: string;
  confidence?: number;
  error?: string;
}

/**
 * Extracts text from a cédula dominicana image using Tesseract.js
 * Optimized for Dominican ID cards
 */
export async function extractCedulaFromImage(
  imageSource: string | File | Blob,
  onProgress?: (progress: number) => void
): Promise<CedulaOCRResult> {
  try {
    // Configure Tesseract for Spanish text recognition
    const result = await Tesseract.recognize(imageSource, 'spa', {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          onProgress(Math.round(m.progress * 100));
        }
      },
    });

    const rawText = result.data.text;
    const confidence = result.data.confidence;

    // Try to extract cédula number from the recognized text
    // Dominican cédulas follow the format: XXX-XXXXXXX-X (11 digits total)
    const cedulaNumber = extractCedulaNumber(rawText);

    if (cedulaNumber) {
      return {
        success: true,
        cedula: cedulaNumber,
        rawText,
        confidence,
      };
    }

    return {
      success: false,
      rawText,
      confidence,
      error: 'No se pudo detectar un número de cédula válido en la imagen',
    };
  } catch (error) {
    console.error('OCR Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Error al procesar la imagen',
    };
  }
}

/**
 * Extracts the 11-digit cédula number from raw OCR text
 * Dominican cédulas can be formatted as:
 * - XXX-XXXXXXX-X
 * - XXXXXXXXXXX (11 consecutive digits)
 * - Various spacing formats
 */
function extractCedulaNumber(text: string): string | null {
  // Remove all non-alphanumeric characters except hyphens and spaces
  const cleanText = text.replace(/[^\d\s-]/g, ' ');
  
  // Pattern 1: Look for XXX-XXXXXXX-X format
  const formattedPattern = /(\d{3})-?(\d{7})-?(\d{1})/;
  const formattedMatch = cleanText.match(formattedPattern);
  if (formattedMatch) {
    return formattedMatch[1] + formattedMatch[2] + formattedMatch[3];
  }

  // Pattern 2: Look for 11 consecutive digits (with possible spaces/hyphens)
  const digitsOnly = cleanText.replace(/[^\d]/g, '');
  
  // Try to find 11-digit sequences
  const elevenDigitPattern = /\d{11}/;
  const elevenDigitMatch = digitsOnly.match(elevenDigitPattern);
  if (elevenDigitMatch) {
    return elevenDigitMatch[0];
  }

  // Pattern 3: Try to find the cédula in segments
  // Sometimes OCR reads it as separate number groups
  const numberGroups = cleanText.match(/\d+/g);
  if (numberGroups) {
    // Concatenate all number groups and check if we can form 11 digits
    const concatenated = numberGroups.join('');
    if (concatenated.length >= 11) {
      // Find the most likely 11-digit sequence
      // Dominican cédulas start with 0 or 4 typically
      for (let i = 0; i <= concatenated.length - 11; i++) {
        const candidate = concatenated.substring(i, i + 11);
        if (isValidCedulaFormat(candidate)) {
          return candidate;
        }
      }
      // If no valid format found, return first 11 digits
      return concatenated.substring(0, 11);
    }
  }

  return null;
}

/**
 * Validates if the string follows a valid Dominican cédula format
 * Basic validation - not a checksum validation
 */
function isValidCedulaFormat(cedula: string): boolean {
  if (cedula.length !== 11) return false;
  
  // Must be all digits
  if (!/^\d{11}$/.test(cedula)) return false;
  
  // First digit is usually 0-4 in Dominican cédulas
  const firstDigit = parseInt(cedula[0], 10);
  if (firstDigit > 4) return false;
  
  return true;
}

/**
 * Compares two cédula numbers for validation
 * Handles minor OCR errors by checking similarity
 */
export function compareCedulas(
  ocrCedula: string,
  userCedula: string,
  tolerance: number = 0
): { match: boolean; similarity: number; errors: number } {
  // Clean both cédulas
  const cleanOcr = ocrCedula.replace(/\D/g, '');
  const cleanUser = userCedula.replace(/\D/g, '');

  if (cleanOcr.length !== 11 || cleanUser.length !== 11) {
    return { match: false, similarity: 0, errors: Math.abs(cleanOcr.length - cleanUser.length) };
  }

  // Count differences
  let errors = 0;
  for (let i = 0; i < 11; i++) {
    if (cleanOcr[i] !== cleanUser[i]) {
      errors++;
    }
  }

  const similarity = ((11 - errors) / 11) * 100;
  const match = errors <= tolerance;

  return { match, similarity, errors };
}

/**
 * Pre-process image before OCR for better results
 * This creates a canvas with enhanced contrast
 */
export async function preprocessImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      // Set canvas size
      canvas.width = img.width;
      canvas.height = img.height;

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      // Draw original image
      ctx.drawImage(img, 0, 0);

      // Get image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Apply grayscale and increase contrast for better OCR
      for (let i = 0; i < data.length; i += 4) {
        // Convert to grayscale
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        
        // Increase contrast
        const contrast = 1.5;
        const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
        const newGray = Math.min(255, Math.max(0, factor * (gray - 128) + 128));

        // Apply threshold for binarization (helps with text recognition)
        const threshold = 128;
        const finalValue = newGray > threshold ? 255 : 0;

        data[i] = finalValue;
        data[i + 1] = finalValue;
        data[i + 2] = finalValue;
      }

      ctx.putImageData(imageData, 0, 0);

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Could not create blob from canvas'));
        }
      }, 'image/png');
    };

    img.onerror = () => reject(new Error('Could not load image'));
    img.src = URL.createObjectURL(file);
  });
}
