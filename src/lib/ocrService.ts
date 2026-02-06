import Tesseract from 'tesseract.js';

// List of Dominican Republic provinces for extraction
const DOMINICAN_PROVINCES = [
  'Distrito Nacional', 'Azua', 'Baoruco', 'Barahona', 'Dajabón',
  'Duarte', 'Elías Piña', 'El Seibo', 'Espaillat', 'Independencia',
  'La Altagracia', 'La Romana', 'La Vega', 'María Trinidad Sánchez',
  'Monte Cristi', 'Montecristi', 'Pedernales', 'Peravia', 'Puerto Plata',
  'Hermanas Mirabal', 'Salcedo', 'Samaná', 'San Cristóbal', 'San Juan',
  'San Pedro de Macorís', 'Sánchez Ramírez', 'Santiago', 'Santiago Rodríguez',
  'Valverde', 'Monseñor Nouel', 'Bonao', 'Monte Plata', 'Hato Mayor',
  'San José de Ocoa', 'Santo Domingo', 'Santo Domingo Este', 
  'Santo Domingo Norte', 'Santo Domingo Oeste'
];

// Common province abbreviations and alternate names
const PROVINCE_ALIASES: Record<string, string> = {
  'DN': 'Distrito Nacional',
  'SD': 'Santo Domingo',
  'SDN': 'Santo Domingo Norte',
  'SDE': 'Santo Domingo Este',
  'SDO': 'Santo Domingo Oeste',
  'STI': 'Santiago',
  'PP': 'Puerto Plata',
  'SPM': 'San Pedro de Macorís',
  'LR': 'La Romana',
  'LV': 'La Vega',
  'SC': 'San Cristóbal',
  'SALCEDO': 'Hermanas Mirabal',
  'BONAO': 'Monseñor Nouel'
};

export interface CedulaOCRResult {
  success: boolean;
  cedula?: string;
  fullName?: string;
  provincia?: string;
  rawText?: string;
  confidence?: number;
  error?: string;
}

/**
 * Extracts text from a cédula dominicana image using Tesseract.js
 * Optimized for Dominican ID cards - extracts cedula, name, and province
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
    const cedulaNumber = extractCedulaNumber(rawText);
    
    // Try to extract full name
    const fullName = extractFullName(rawText);
    
    // Try to extract province
    const provincia = extractProvincia(rawText);

    if (cedulaNumber) {
      return {
        success: true,
        cedula: cedulaNumber,
        fullName,
        provincia,
        rawText,
        confidence,
      };
    }

    return {
      success: false,
      fullName,
      provincia,
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

  // Pattern 2: Look for 11 consecutive digits
  const digitsOnly = cleanText.replace(/[^\d]/g, '');
  const elevenDigitPattern = /\d{11}/;
  const elevenDigitMatch = digitsOnly.match(elevenDigitPattern);
  if (elevenDigitMatch) {
    return elevenDigitMatch[0];
  }

  // Pattern 3: Try to find the cédula in segments
  const numberGroups = cleanText.match(/\d+/g);
  if (numberGroups) {
    const concatenated = numberGroups.join('');
    if (concatenated.length >= 11) {
      for (let i = 0; i <= concatenated.length - 11; i++) {
        const candidate = concatenated.substring(i, i + 11);
        if (isValidCedulaFormat(candidate)) {
          return candidate;
        }
      }
      return concatenated.substring(0, 11);
    }
  }

  return null;
}

/**
 * Extracts the full name from the cédula OCR text
 * Dominican cédulas typically have the name after "NOMBRES" or in uppercase
 */
function extractFullName(text: string): string | null {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  
  // Pattern 1: Look for lines that might contain name (after NOMBRES or APELLIDOS)
  let foundNames = false;
  const nameLines: string[] = [];
  
  for (const line of lines) {
    const upperLine = line.toUpperCase();
    
    // Skip common header/label text
    if (upperLine.includes('CEDULA') || 
        upperLine.includes('IDENTIDAD') || 
        upperLine.includes('ELECTORAL') ||
        upperLine.includes('REPUBLICA') ||
        upperLine.includes('DOMINICANA') ||
        upperLine.includes('FECHA') ||
        upperLine.includes('NACIMIENTO') ||
        upperLine.includes('LUGAR') ||
        /^\d+[-\s]?\d*[-\s]?\d*$/.test(line)) {
      continue;
    }
    
    // Look for name labels
    if (upperLine.includes('NOMBRE') || upperLine.includes('APELLIDO')) {
      foundNames = true;
      // Extract text after the label
      const afterLabel = line.replace(/.*(?:NOMBRES?|APELLIDOS?)\s*:?\s*/i, '');
      if (afterLabel.length > 2 && /^[A-ZÁÉÍÓÚÑ\s]+$/i.test(afterLabel)) {
        nameLines.push(afterLabel);
      }
      continue;
    }
    
    // If we're in name section, collect uppercase word lines
    if (foundNames && /^[A-ZÁÉÍÓÚÑ\s]{3,}$/.test(line) && line.length < 50) {
      nameLines.push(line);
    }
    
    // Alternative: look for lines that are all uppercase letters (likely names)
    if (/^[A-ZÁÉÍÓÚÑ]{2,}\s+[A-ZÁÉÍÓÚÑ\s]+$/.test(line) && line.length >= 5 && line.length < 50) {
      // Check it's not a province name
      const isProvince = DOMINICAN_PROVINCES.some(p => 
        line.toUpperCase().includes(p.toUpperCase())
      );
      if (!isProvince) {
        nameLines.push(line);
      }
    }
  }
  
  if (nameLines.length > 0) {
    // Clean and combine name parts
    return nameLines
      .slice(0, 2) // Max 2 lines (apellidos + nombres)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toUpperCase();
  }
  
  return null;
}

/**
 * Extracts the province from the cédula OCR text
 * Looks for known Dominican province names
 */
function extractProvincia(text: string): string | null {
  const upperText = text.toUpperCase();
  
  // First check for province aliases/abbreviations
  for (const [alias, province] of Object.entries(PROVINCE_ALIASES)) {
    const aliasPattern = new RegExp(`\\b${alias}\\b`, 'i');
    if (aliasPattern.test(upperText)) {
      return province;
    }
  }
  
  // Look for full province names
  for (const province of DOMINICAN_PROVINCES) {
    const provincePattern = new RegExp(`\\b${province.replace(/\s+/g, '\\s*')}\\b`, 'i');
    if (provincePattern.test(text)) {
      // Normalize province name
      if (province === 'Montecristi') return 'Monte Cristi';
      if (province === 'Salcedo') return 'Hermanas Mirabal';
      if (province === 'Bonao') return 'Monseñor Nouel';
      if (province.startsWith('Santo Domingo')) return 'Santo Domingo';
      return province;
    }
  }
  
  // Look for "LUGAR DE NACIMIENTO" section
  const lugarMatch = text.match(/LUGAR\s*(?:DE\s*)?NACIMIENTO\s*:?\s*([A-ZÁÉÍÓÚÑa-záéíóúñ\s,]+)/i);
  if (lugarMatch) {
    const lugarText = lugarMatch[1];
    for (const province of DOMINICAN_PROVINCES) {
      if (lugarText.toUpperCase().includes(province.toUpperCase())) {
        if (province.startsWith('Santo Domingo')) return 'Santo Domingo';
        return province;
      }
    }
  }
  
  return null;
}

/**
 * Validates if the string follows a valid Dominican cédula format
 */
function isValidCedulaFormat(cedula: string): boolean {
  if (cedula.length !== 11) return false;
  if (!/^\d{11}$/.test(cedula)) return false;
  const firstDigit = parseInt(cedula[0], 10);
  if (firstDigit > 4) return false;
  return true;
}

/**
 * Compares two cédula numbers for validation
 */
export function compareCedulas(
  ocrCedula: string,
  userCedula: string,
  tolerance: number = 0
): { match: boolean; similarity: number; errors: number } {
  const cleanOcr = ocrCedula.replace(/\D/g, '');
  const cleanUser = userCedula.replace(/\D/g, '');

  if (cleanOcr.length !== 11 || cleanUser.length !== 11) {
    return { match: false, similarity: 0, errors: Math.abs(cleanOcr.length - cleanUser.length) };
  }

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
 */
export async function preprocessImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;

      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Apply grayscale and increase contrast for better OCR
      for (let i = 0; i < data.length; i += 4) {
        const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
        const contrast = 1.5;
        const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
        const newGray = Math.min(255, Math.max(0, factor * (gray - 128) + 128));
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
