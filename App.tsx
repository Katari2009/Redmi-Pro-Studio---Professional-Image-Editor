
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { EditorSettings, PresetType } from './types';
import { INITIAL_SETTINGS, PRESETS } from './constants';
import { processImage } from './services/imageProcessor';

/**
 * REDMI PRO STUDIO - PROFESSIONAL IMAGE EDITOR
 * Versión: 2.0.5
 * Última actualización: 2024-05-20 (Fix Masterpiece AI Logic)
 */

const ControlSlider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
}> = ({ label, value, min, max, onChange }) => (
  <div className="mb-5">
    <div className="flex justify-between text-[11px] text-gray-400 mb-2 uppercase tracking-wider">
      <span>{label}</span>
      <span className="text-orange-500 font-bold">{value}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
    />
  </div>
);

const App: React.FC = () => {
  const [settings, setSettings] = useState<EditorSettings>(INITIAL_SETTINGS);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [imageName, setImageName] = useState<string>('');
  const [isAIAnalyzing, setIsAIAnalyzing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setImage(img);
          setImageName(file.name);
          setSettings(INITIAL_SETTINGS);
          showToast(`Imagen lista para edición pro`);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current || !image) return;
    const link = document.createElement('a');
    link.download = `redmi_studio_${imageName}`;
    link.href = canvasRef.current.toDataURL('image/jpeg', 0.95);
    link.click();
    showToast('Exportación completada');
  };

  const applyPreset = (type: PresetType) => {
    if (type === 'reset') {
      setSettings(INITIAL_SETTINGS);
      showToast('Ajustes de fábrica');
      return;
    }
    const preset = PRESETS[type];
    if (preset) {
      setSettings({ ...INITIAL_SETTINGS, ...preset.settings });
      showToast(`${preset.name} aplicado`);
    }
  };

  const analyzeWithAI = async () => {
    if (!image || !canvasRef.current) return;
    
    // Verificación crítica de API Key para Vercel
    if (!process.env.API_KEY || process.env.API_KEY === '') {
      showToast('Error: Configura la API_KEY en Vercel');
      console.error('API_KEY no encontrada en las variables de entorno.');
      return;
    }

    setIsAIAnalyzing(true);
    showToast('IA analizando histograma y color...');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      // Reducimos un poco más la calidad para el análisis rápido y evitar límites de tokens
      const base64Data = canvasRef.current.toDataURL('image/jpeg', 0.4).split(',')[1];
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { text: "Actúa como un colorista profesional de cine. Analiza esta imagen y devuelve los ajustes de revelado ideales para que luzca profesional. Devuelve exclusivamente un JSON con estas claves: exposure, contrast, shadows, highlights, whites, temp, tint, saturation, vibrance, sharpness, clarity, vignette. Rango de valores de -100 a 100." },
            { inlineData: { mimeType: 'image/jpeg', data: base64Data } }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              exposure: { type: Type.INTEGER },
              contrast: { type: Type.INTEGER },
              shadows: { type: Type.INTEGER },
              highlights: { type: Type.INTEGER },
              whites: { type: Type.INTEGER },
              temp: { type: Type.INTEGER },
              tint: { type: Type.INTEGER },
              saturation: { type: Type.INTEGER },
              vibrance: { type: Type.INTEGER },
              sharpness: { type: Type.INTEGER },
              clarity: { type: Type.INTEGER },
              vignette: { type: Type.INTEGER }
            },
            required: ["exposure", "contrast", "shadows", "highlights", "whites", "temp", "tint", "saturation", "vibrance", "sharpness", "clarity", "vignette"]
          }
        }
      });

      const textResult = response.text;
      if (textResult) {
        const aiSettings = JSON.parse(textResult.trim());
        setSettings(aiSettings);
        showToast('Optimización IA aplicada');
      }
    } catch (error) {
      console.error('Masterpiece AI Error:', error);
      showToast('Error de conexión con el motor IA');
    } finally {
      setIsAIAnalyzing(false);
    }
  };

  useEffect(() => {
    if (image && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (ctx) {
        canvas.width = image.width;
        canvas.height = image.height;
        processImage(ctx, image, settings);
      }
    }
  }, [image, settings]);

  return (
    <div className="flex flex-col h-screen bg-[#121212] overflow-hidden select-none text-gray-200">
      {/* Navbar */}
      <header className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-3 bg-[#1e1e1e] border-b border-[#333] z-20 gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-orange-600 p-1.5 rounded-lg shadow-lg">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            </svg>
          </div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-white uppercase">
            Redmi Pro Studio <span className="ml-1 px-1.5 py-0.5 bg-orange-600 text-[9px] font-black rounded align-middle">PRO</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold rounded-md transition-all active:scale-95 shadow-md uppercase tracking-wider"
          >
            <span>Seleccionar Imagen</span>
          </button>
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            accept="image/*" 
            className="hidden" 
          />
        </div>
      </header>

      {/* Main UI */}
      <main className="flex flex-col md:flex-row flex-1 overflow-hidden relative">
        {/* Workspace */}
        <div className="flex-[1.2] md:flex-1 bg-[#0a0a0a] flex items-center justify-center p-4 sm:p-12 overflow-auto relative min-h-[40vh] md:min-h-0">
          {!image && (
            <div className="text-center space-y-4 max-w-sm pointer-events-none p-6 animate-pulse">
              <div className="text-gray-800 flex justify-center">
                <svg className="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-700 uppercase tracking-widest">Estudio listo</h3>
            </div>
          )}
          <canvas 
            ref={canvasRef} 
            className={`max-w-full max-h-full shadow-2xl transition-all duration-700 ${image ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
          />
        </div>

        {/* Sidebar */}
        <aside className="w-full md:w-[380px] bg-[#1a1a1a] border-t md:border-t-0 md:border-l border-[#333] flex flex-col h-auto md:h-full overflow-y-auto p-6 z-10">
          
          <button 
            disabled={!image || isAIAnalyzing}
            onClick={analyzeWithAI}
            className={`w-full mb-8 py-4 rounded-xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl
              ${image ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer active:scale-95' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}
              ${isAIAnalyzing ? 'animate-pulse' : ''}`}
          >
            <span>{isAIAnalyzing ? '🔄' : '✨'}</span>
            {isAIAnalyzing ? 'Analizando...' : 'Masterpiece AI'}
          </button>

          <section className="mb-10">
            <h4 className="text-[10px] uppercase font-black text-gray-500 tracking-[0.3em] mb-5 border-b border-[#333] pb-2">Revelado Rápido</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => applyPreset(key as PresetType)}
                  className="flex items-center gap-3 px-3 py-3 bg-[#222] hover:bg-[#282828] border border-[#333] rounded-lg transition-all text-left active:scale-95 group"
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: preset.color }} />
                  <span className="text-[10px] text-gray-400 font-bold group-hover:text-white uppercase truncate">{preset.name.split(' ')[1]}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-10">
            <div>
              <h4 className="text-[10px] uppercase font-black text-gray-500 tracking-[0.3em] mb-6 border-b border-[#333] pb-2">Panel Lumínico</h4>
              <ControlSlider label="Exposición" value={settings.exposure} min={-100} max={100} onChange={v => setSettings(s => ({...s, exposure: v}))} />
              <ControlSlider label="Contraste" value={settings.contrast} min={-100} max={100} onChange={v => setSettings(s => ({...s, contrast: v}))} />
              <ControlSlider label="Sombras" value={settings.shadows} min={-100} max={100} onChange={v => setSettings(s => ({...s, shadows: v}))} />
              <ControlSlider label="Blancos" value={settings.whites} min={-100} max={100} onChange={v => setSettings(s => ({...s, whites: v}))} />
            </div>

            <div>
              <h4 className="text-[10px] uppercase font-black text-gray-500 tracking-[0.3em] mb-6 border-b border-[#333] pb-2">Color & Balanza</h4>
              <ControlSlider label="Temperatura" value={settings.temp} min={-100} max={100} onChange={v => setSettings(s => ({...s, temp: v}))} />
              <ControlSlider label="Tinte" value={settings.tint} min={-100} max={100} onChange={v => setSettings(s => ({...s, tint: v}))} />
              <ControlSlider label="Saturación" value={settings.saturation} min={-100} max={100} onChange={v => setSettings(s => ({...s, saturation: v}))} />
              <ControlSlider label="Intensidad" value={settings.vibrance} min={-100} max={100} onChange={v => setSettings(s => ({...s, vibrance: v}))} />
            </div>

            <div>
              <h4 className="text-[10px] uppercase font-black text-gray-500 tracking-[0.3em] mb-6 border-b border-[#333] pb-2">Detalle & Lente</h4>
              <ControlSlider label="Nitidez" value={settings.sharpness} min={0} max={100} onChange={v => setSettings(s => ({...s, sharpness: v}))} />
              <ControlSlider label="Claridad" value={settings.clarity} min={-100} max={100} onChange={v => setSettings(s => ({...s, clarity: v}))} />
              <ControlSlider label="Viñeteado" value={settings.vignette} min={-100} max={100} onChange={v => setSettings(s => ({...s, vignette: v}))} />
            </div>
          </section>

          <div className="mt-12 mb-8 space-y-4">
            <button 
              onClick={() => applyPreset('reset')}
              className="w-full py-3.5 text-[9px] font-black text-gray-500 hover:text-white bg-transparent border border-[#333] rounded-xl hover:bg-[#222] transition-all uppercase tracking-[0.2em]"
            >
              Restaurar Original
            </button>
            <button 
              disabled={!image}
              onClick={handleDownload}
              className={`w-full py-4 text-[11px] font-black rounded-xl flex items-center justify-center gap-3 transition-all uppercase tracking-[0.2em] shadow-2xl
                ${image ? 'bg-white text-black hover:bg-orange-600 hover:text-white cursor-pointer active:scale-[0.98]' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
            >
              <span>Exportar Resultado</span>
            </button>
          </div>

          <footer className="mt-6 pb-10 border-t border-[#333] pt-8 text-center">
             <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">Creado por Christian Núñez V. 2026</p>
             <p className="text-[8px] text-gray-700 mt-2 uppercase tracking-[0.3em]">Professional Suite Engine • v2.0.5</p>
          </footer>
        </aside>
      </main>

      {/* Toasts */}
      {toast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 px-10 py-4 bg-orange-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-5">
          {toast}
        </div>
      )}
    </div>
  );
};

export default App;
