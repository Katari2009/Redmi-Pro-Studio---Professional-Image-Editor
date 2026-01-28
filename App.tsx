
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { EditorSettings, PresetType } from './types';
import { INITIAL_SETTINGS, PRESETS } from './constants';
import { processImage } from './services/imageProcessor';

// Componentes Reutilizables
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
          showToast(`Imagen cargada: ${img.width}x${img.height}`);
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
    showToast('Imagen exportada correctamente');
  };

  const applyPreset = (type: PresetType) => {
    if (type === 'reset') {
      setSettings(INITIAL_SETTINGS);
      showToast('Ajustes restablecidos');
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
    setIsAIAnalyzing(true);
    showToast('IA analizando escena...');
    
    try {
      // Usar la inicialización recomendada por las guías
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Data = canvasRef.current.toDataURL('image/jpeg', 0.5).split(',')[1];
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { text: "Eres un experto colorista cinematográfico. Analiza esta imagen y genera los parámetros ideales de revelado digital. Devuelve exclusivamente un objeto JSON válido con las siguientes claves: exposure, contrast, shadows, highlights, whites, temp, tint, saturation, vibrance, sharpness, clarity, vignette. Los valores deben ser números enteros entre -100 y 100 (nitidez de 0 a 100). No añadas explicaciones, solo el JSON." },
            { 
              inlineData: { 
                mimeType: 'image/jpeg', 
                data: base64Data 
              } 
            }
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

      if (response.text) {
        const aiSettings = JSON.parse(response.text.trim());
        setSettings(aiSettings);
        showToast('Optimización IA finalizada');
      } else {
        throw new Error('Respuesta de IA vacía');
      }
    } catch (error) {
      console.error('Error detallado en Masterpiece AI:', error);
      showToast('Error en el motor IA. Verifica la conexión.');
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
    <div className="flex flex-col h-screen bg-[#121212] overflow-hidden select-none">
      {/* Navbar */}
      <header className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-3 bg-[#1e1e1e] border-b border-[#333] z-20 gap-3 sm:gap-0">
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
            <span>Abrir Foto</span>
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

      {/* Workspace */}
      <main className="flex flex-col md:flex-row flex-1 overflow-hidden relative">
        
        {/* Visualizer */}
        <div className="flex-[1.2] md:flex-1 bg-[#0a0a0a] flex items-center justify-center p-4 sm:p-12 overflow-auto relative min-h-[35vh] md:min-h-0">
          {!image && (
            <div className="text-center space-y-4 max-w-sm pointer-events-none p-6">
              <div className="text-gray-800 flex justify-center opacity-50">
                <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-600 uppercase tracking-widest">Esperando archivo...</h3>
            </div>
          )}
          <canvas 
            ref={canvasRef} 
            className={`max-w-full max-h-full shadow-[0_35px_60px_-15px_rgba(0,0,0,0.7)] transition-opacity duration-500 ${image ? 'opacity-100' : 'opacity-0'}`}
          />
        </div>

        {/* Professional Sidebar */}
        <aside className="w-full md:w-[380px] bg-[#1a1a1a] border-t md:border-t-0 md:border-l border-[#333] flex flex-col h-auto md:h-full overflow-y-auto p-6 scroll-smooth z-10">
          
          <button 
            disabled={!image || isAIAnalyzing}
            onClick={analyzeWithAI}
            className={`w-full mb-8 py-4 rounded-xl flex items-center justify-center gap-3 font-black text-[10px] uppercase tracking-[0.2em] transition-all
              ${image ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer active:scale-[0.98] shadow-lg shadow-indigo-900/30' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}
              ${isAIAnalyzing ? 'animate-pulse scale-[0.98]' : ''}`}
          >
            <span>{isAIAnalyzing ? '⏳' : '✨'}</span>
            {isAIAnalyzing ? 'Procesando Escena...' : 'Masterpiece AI'}
          </button>

          <section className="mb-10">
            <h4 className="text-[10px] uppercase font-black text-gray-500 tracking-[0.3em] mb-5 border-b border-[#333] pb-2">Looks de Cámara</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => applyPreset(key as PresetType)}
                  className="flex items-center gap-3 px-3 py-3 bg-[#222] hover:bg-[#333] border border-[#333] rounded-lg transition-all text-left active:scale-95 group"
                >
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: preset.color }} />
                  <span className="text-[10px] text-gray-400 font-bold group-hover:text-white uppercase truncate">{preset.name.split(' ')[1]}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-12">
            <div>
              <h4 className="text-[10px] uppercase font-black text-gray-500 tracking-[0.3em] mb-6 border-b border-[#333] pb-2">Luz y Tono</h4>
              <ControlSlider label="Exposición" value={settings.exposure} min={-100} max={100} onChange={v => setSettings(s => ({...s, exposure: v}))} />
              <ControlSlider label="Contraste" value={settings.contrast} min={-100} max={100} onChange={v => setSettings(s => ({...s, contrast: v}))} />
              <ControlSlider label="Sombras" value={settings.shadows} min={-100} max={100} onChange={v => setSettings(s => ({...s, shadows: v}))} />
              <ControlSlider label="Blancos" value={settings.whites} min={-100} max={100} onChange={v => setSettings(s => ({...s, whites: v}))} />
            </div>

            <div>
              <h4 className="text-[10px] uppercase font-black text-gray-500 tracking-[0.3em] mb-6 border-b border-[#333] pb-2">Colorimetría</h4>
              <ControlSlider label="Temperatura" value={settings.temp} min={-100} max={100} onChange={v => setSettings(s => ({...s, temp: v}))} />
              <ControlSlider label="Tinte" value={settings.tint} min={-100} max={100} onChange={v => setSettings(s => ({...s, tint: v}))} />
              <ControlSlider label="Saturación" value={settings.saturation} min={-100} max={100} onChange={v => setSettings(s => ({...s, saturation: v}))} />
            </div>

            <div>
              <h4 className="text-[10px] uppercase font-black text-gray-500 tracking-[0.3em] mb-6 border-b border-[#333] pb-2">Óptica y Textura</h4>
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
                ${image ? 'bg-white text-black hover:bg-orange-500 hover:text-white cursor-pointer active:scale-95' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
            >
              <span>Exportar JPG</span>
            </button>
          </div>

          <footer className="mt-6 pb-10 border-t border-[#333] pt-8 text-center">
             <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em]">Creado por Christian Núñez V. 2026</p>
             <p className="text-[8px] text-gray-700 mt-2 uppercase tracking-[0.3em]">Professional Suite for Web • v2.0.1</p>
          </footer>
        </aside>
      </main>

      {/* Popups */}
      {toast && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 px-8 py-3 bg-orange-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-2xl z-50 animate-bounce">
          {toast}
        </div>
      )}
    </div>
  );
};

export default App;
