import React, { useState } from 'react';
import { createWorker } from 'tesseract.js';

const CedulaOCRValidator = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState('');

  const processImage = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    try {
      // Iniciamos el motor OCR localmente en el móvil
      const worker = await createWorker('spa'); 
      const { data: { text } } = await worker.recognize(file);
      await worker.terminate();
      
      setExtractedData(text);
      // Aquí el sistema vinculará los datos para la futura recompensa del Gladiador
    } catch (error) {
      console.error("Error en el blindaje OCR:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 bg-slate-900 text-white rounded-xl shadow-2xl border border-blue-500">
      <h3 className="text-lg font-bold mb-4">Escaneo de Cédula (Blindaje Local)</h3>
      <input 
        type="file" 
        accept="image/*" 
        onChange={processImage}
        className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white"
      />
      
      {isProcessing && (
        <div className="mt-4 text-blue-400 animate-pulse">
          Procesando datos en el dispositivo...
        </div>
      )}

      {extractedData && (
        <div className="mt-4 p-3 bg-black rounded border border-green-500">
          <p className="text-xs text-green-400">Datos verificados:</p>
          <pre className="text-[10px] whitespace-pre-wrap mt-2">{extractedData}</pre>
        </div>
      )}
    </div>
  );
};

export default CedulaOCRValidator;
