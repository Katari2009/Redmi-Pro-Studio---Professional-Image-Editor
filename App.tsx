
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { EditorSettings, PresetType } from './types';
import { INITIAL_SETTINGS, PRESETS } from './constants';
import { processImage } from './services/imageProcessor';

/**
 * REDMI PRO STUDIO - PROFESSIONAL IMAGE EDITOR
 * Versión: 2.0.7 (Responsive Edition)
 * Autor: Christian Núñez V. 2026
 * Optimizado para: Mobile, Tablet, Desktop
 */

const ControlSlider: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (val: number) => void;
}> = ({ label, value, min, max, onChange }) => (
  <div className="mb-4 sm:mb-6">
    <div className="flex justify-between text-[10px] sm:text-[11px] text-gray-400 mb-2 uppercase tracking-widest font-medium">
      <span>{label}</span>
      <span className="text-orange-500 font-bold">{value}</span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      value={value}
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
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
          showToast(`Proyecto iniciado`);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current || !image) return;
    const link = document.createElement('a');
    link.download = `redmi_master_${Date.now()}.jpg`;
    link.href = canvasRef.current.toDataURL('image/jpeg', 0.95);
    link.click();
    showToast('Exportación finalizada');
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
      showToast(`${preset.name} activo`);
    }
  };

  const analyzeWithAI = async () => {
    if (!image || !canvasRef.current) return;
    setIsAIAnalyzing(true);
    showToast('IA Analizando Escena...');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Data = canvasRef.current.toDataURL('image/jpeg', 0.4).split(',')[1];
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { text: "Analiza la colorimetría de esta foto y devuelve un JSON profesional con: exposure, contrast, shadows, highlights, whites, temp, tint, saturation, vibrance, sharpness, clarity, vignette (-100 a 100)." },
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
            }
          }
        }
      });

      const rawText = response.text;
      if (rawText) {
        const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const aiSettings = JSON.parse(cleanJson);
        setSettings(aiSettings);
        showToast('Look IA Aplicado');
      }
    } catch (error) {
      showToast('Error IA: Verifica tu conexión');
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
    <div className="flex flex-col h-[100dvh] bg-[#0a0a0a] overflow-hidden text-gray-200">
      {/* HEADER: Fijo en la parte superior */}
      <header className="flex items-center justify-between px-4 sm:px-6 py-3 bg-[#161616] border-b border-[#2a2a2a] z-30 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="bg-orange-600 p-1.5 rounded-lg shadow-lg">
            <svg className="w-4 h-4 sm:w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-xs sm:text-base font-black tracking-tighter uppercase italic">
            Redmi Studio <span className="ml-1 px-1 py-0.5 bg-orange-600 text-[8px] sm:text-[9px] rounded not-italic shadow-sm">ULTRA</span>
          </h1>
        </div>
        
        <button 
          onClick={() => fileInputRef.current?.click()}
          className="px-4 sm:px-6 py-2 bg-[#2a2a2a] hover:bg-orange-600 text-white text-[9px] sm:text-[10px] font-black rounded-full transition-all active:scale-95 uppercase tracking-widest border border-[#333]"
        >
          {image ? 'Cambiar Foto' : 'Abrir Foto'}
        </button>
        <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept="image/*" className="hidden" />
      </header>

      {/* MAIN: Contenedor flexible que cambia entre columna (móvil) y fila (escritorio) */}
      <main className="flex flex-col md:flex-row flex-1 min-h-0 overflow-hidden">
        
        {/* VIEWPORT: El canvas se adapta al espacio disponible */}
        <div className="flex-[1] md:flex-[1.4] bg-[#050505] flex items-center justify-center p-4 sm:p-8 relative min-h-[35vh] md:min-h-0 overflow-hidden">
          {!image && (
            <div className="text-center opacity-20 flex flex-col items-center gap-4 animate-pulse">
              <svg className="w-16 h-16 sm:w-24 sm:h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-[9px] sm:text-[11px] uppercase tracking-[0.4em] font-light">Esperando entrada de imagen</p>
            </div>
          )}
          <div className="relative w-full h-full flex items-center justify-center">
             <canvas 
               ref={canvasRef} 
               className={`transition-all duration-700 ${image ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
             />
          </div>
        </div>

        {/* CONTROLES: Barra lateral con scroll independiente */}
        <aside className="w-full md:w-[380px] lg:w-[420px] bg-[#121212] border-t md:border-t-0 md:border-l border-[#2a2a2a] flex flex-col h-[50vh] md:h-full overflow-y-auto p-5 sm:p-8 custom-scrollbar z-20 shrink-0">
          
          <button 
            disabled={!image || isAIAnalyzing}
            onClick={analyzeWithAI}
            className={`w-full mb-8 py-4 sm:py-5 rounded-2xl flex items-center justify-center gap-3 font-black text-[10px] sm:text-[11px] uppercase tracking-[0.2em] transition-all
              ${image ? 'bg-gradient-to-br from-indigo-600 to-purple-700 hover:scale-[1.02] text-white shadow-xl shadow-indigo-500/10 active:scale-95' : 'bg-[#1e1e1e] text-gray-700 cursor-not-allowed'}
              ${isAIAnalyzing ? 'animate-pulse' : ''}`}
          >
            {isAIAnalyzing ? '✨ Procesando...' : '⭐ Masterpiece AI'}
          </button>

          <section className="mb-10">
            <h4 className="text-[9px] sm:text-[10px] uppercase font-black text-gray-500 tracking-[0.4em] mb-5 border-b border-[#2a2a2a] pb-2">Presets Pro</h4>
            <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-2 gap-2 sm:gap-3">
              {Object.entries(PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => applyPreset(key as PresetType)}
                  className="flex items-center gap-2 px-3 py-2.5 bg-[#1a1a1a] hover:bg-[#222] border border-[#262626] rounded-xl transition-all active:scale-95 group overflow-hidden"
                >
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full shrink-0" style={{ backgroundColor: preset.color }} />
                  <span className="text-[8px] sm:text-[9px] text-gray-500 font-bold group-hover:text-white uppercase truncate tracking-tighter">
                    {preset.name.split(' ').slice(1).join(' ')}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-10 sm:space-y-12">
            <div>
              <h4 className="text-[9px] sm:text-[10px] uppercase font-black text-orange-500/40 tracking-[0.4em] mb-6 border-b border-[#2a2a2a] pb-2 text-center md:text-left">Iluminación</h4>
              <ControlSlider label="Exposición" value={settings.exposure} min={-100} max={100} onChange={v => setSettings(s => ({...s, exposure: v}))} />
              <ControlSlider label="Contraste" value={settings.contrast} min={-100} max={100} onChange={v => setSettings(s => ({...s, contrast: v}))} />
              <ControlSlider label="Sombras" value={settings.shadows} min={-100} max={100} onChange={v => setSettings(s => ({...s, shadows: v}))} />
              <ControlSlider label="Altas Luces" value={settings.highlights} min={-100} max={100} onChange={v => setSettings(s => ({...s, highlights: v}))} />
            </div>

            <div>
              <h4 className="text-[9px] sm:text-[10px] uppercase font-black text-orange-500/40 tracking-[0.4em] mb-6 border-b border-[#2a2a2a] pb-2 text-center md:text-left">Colorimetría</h4>
              <ControlSlider label="Temp" value={settings.temp} min={-100} max={100} onChange={v => setSettings(s => ({...s, temp: v}))} />
              <ControlSlider label="Saturación" value={settings.saturation} min={-100} max={100} onChange={v => setSettings(s => ({...s, saturation: v}))} />
              <ControlSlider label="Intensidad" value={settings.vibrance} min={-100} max={100} onChange={v => setSettings(s => ({...s, vibrance: v}))} />
            </div>

            <div>
              <h4 className="text-[9px] sm:text-[10px] uppercase font-black text-orange-500/40 tracking-[0.4em] mb-6 border-b border-[#2a2a2a] pb-2 text-center md:text-left">Óptica</h4>
              <ControlSlider label="Nitidez" value={settings.sharpness} min={0} max={100} onChange={v => setSettings(s => ({...s, sharpness: v}))} />
              <ControlSlider label="Viñeta" value={settings.vignette} min={-100} max={100} onChange={v => setSettings(s => ({...s, vignette: v}))} />
            </div>
          </section>

          <div className="mt-12 mb-10 space-y-3">
            <button 
              onClick={() => applyPreset('reset')}
              className="w-full py-3.5 text-[9px] font-black text-gray-500 hover:text-white bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl hover:bg-[#222] transition-all uppercase tracking-[0.3em]"
            >
              Reset Total
            </button>
            <button 
              disabled={!image}
              onClick={handleDownload}
              className={`w-full py-4 sm:py-5 text-[10px] sm:text-[11px] font-black rounded-xl flex items-center justify-center gap-3 transition-all uppercase tracking-[0.3em] shadow-2xl
                ${image ? 'bg-white text-black hover:bg-orange-600 hover:text-white cursor-pointer active:scale-95' : 'bg-[#1e1e1e] text-gray-700 cursor-not-allowed'}`}
            >
              <span>Exportar Resultado</span>
            </button>
          </div>

          <footer className="mt-auto border-t border-[#2a2a2a] pt-8 text-center pb-6">
             <p className="text-[9px] text-gray-600 font-black uppercase tracking-[0.3em]">© Christian Núñez V. 2026</p>
             <div className="flex justify-center items-center gap-2 mt-2">
               <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
               <p className="text-[8px] text-gray-800 uppercase tracking-[0.4em]">Multiplatform Engine v2.0.7</p>
             </div>
          </footer>
        </aside>
      </main>

      {/* Popups de Notificación */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 px-8 py-3 bg-orange-600 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-2xl z-[100] animate-in fade-in zoom-in duration-300">
          {toast}
        </div>
      )}
    </div>
  );
};

export default App;
