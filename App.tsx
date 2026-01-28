
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { EditorSettings, PresetType } from './types';
import { INITIAL_SETTINGS, PRESETS } from './constants';
import { processImage } from './services/imageProcessor';

/**
 * REDMI PRO STUDIO - PROFESSIONAL IMAGE EDITOR
 * Versión: 2.0.6
 * Autor: Christian Núñez V. 2026
 * Build ID: 2026-PRO-STUDIO-STABLE-FIX
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
          showToast(`Archivo cargado con éxito`);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current || !image) return;
    const link = document.createElement('a');
    link.download = `redmi_studio_${Date.now()}_${imageName}`;
    link.href = canvasRef.current.toDataURL('image/jpeg', 0.98);
    link.click();
    showToast('Imagen guardada en alta resolución');
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
    if (!image || !canvasRef.current) {
      showToast('Primero selecciona una imagen');
      return;
    }
    
    setIsAIAnalyzing(true);
    showToast('IA Procesando Masterpiece...');
    
    try {
      // Inicialización garantizada según especificaciones Gemini
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Data = canvasRef.current.toDataURL('image/jpeg', 0.5).split(',')[1];
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { text: "Actúa como un colorista profesional de post-producción fotográfica. Analiza esta imagen y genera los parámetros técnicos de revelado (Lightroom style) para maximizar su estética profesional. Devuelve estrictamente un objeto JSON con estas claves: exposure, contrast, shadows, highlights, whites, temp, tint, saturation, vibrance, sharpness, clarity, vignette. Rango de valores: enteros de -100 a 100." },
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
            }
          }
        }
      });

      const rawText = response.text;
      if (rawText) {
        // Limpieza de posibles bloques markdown para evitar errores de parseo
        const cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
        const aiSettings = JSON.parse(cleanJson);
        setSettings(aiSettings);
        showToast('¡Masterpiece AI aplicado!');
      } else {
        throw new Error('Sin respuesta del motor');
      }
    } catch (error) {
      console.error('Error en Masterpiece AI:', error);
      showToast('Error de conexión. Verifica la API KEY.');
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
      {/* Header */}
      <header className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-4 bg-[#1e1e1e] border-b border-[#333] z-20 gap-3">
        <div className="flex items-center gap-3">
          <div className="bg-orange-600 p-2 rounded-lg shadow-xl">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-base sm:text-lg font-bold tracking-tighter text-white uppercase italic">
            Redmi Pro Studio <span className="ml-1 px-1.5 py-0.5 bg-orange-600 text-[9px] font-black rounded not-italic">ULTRA</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 sm:flex-none px-8 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-[10px] font-black rounded-lg transition-all active:scale-95 shadow-lg uppercase tracking-widest"
          >
            Abrir Proyecto
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

      {/* Interface */}
      <main className="flex flex-col md:flex-row flex-1 overflow-hidden relative">
        {/* Canvas Area */}
        <div className="flex-[1.5] md:flex-1 bg-[#080808] flex items-center justify-center p-6 sm:p-12 overflow-auto relative">
          {!image && (
            <div className="text-center space-y-4 max-w-xs opacity-30 pointer-events-none">
              <svg className="w-20 h-20 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-[10px] uppercase tracking-[0.3em]">Importe una imagen para comenzar</p>
            </div>
          )}
          <canvas 
            ref={canvasRef} 
            className={`max-w-full max-h-full shadow-[0_0_100px_rgba(0,0,0,0.8)] transition-all duration-1000 ${image ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}
          />
        </div>

        {/* Sidebar Controls */}
        <aside className="w-full md:w-[400px] bg-[#161616] border-t md:border-t-0 md:border-l border-[#2a2a2a] flex flex-col h-auto md:h-full overflow-y-auto p-8 z-10 custom-scrollbar">
          
          <button 
            disabled={!image || isAIAnalyzing}
            onClick={analyzeWithAI}
            className={`w-full mb-10 py-5 rounded-2xl flex items-center justify-center gap-4 font-black text-[11px] uppercase tracking-[0.25em] transition-all
              ${image ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white cursor-pointer active:scale-95 shadow-2xl shadow-indigo-500/20' : 'bg-[#222] text-gray-700 cursor-not-allowed'}
              ${isAIAnalyzing ? 'animate-pulse' : ''}`}
          >
            <span>{isAIAnalyzing ? '✨' : '⭐'}</span>
            {isAIAnalyzing ? 'AI Generando Look...' : 'Masterpiece AI'}
          </button>

          <section className="mb-12">
            <h4 className="text-[10px] uppercase font-black text-orange-500/60 tracking-[0.4em] mb-6 border-b border-[#2a2a2a] pb-3">Presets Profesionales</h4>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => applyPreset(key as PresetType)}
                  className="flex items-center gap-3 px-4 py-3 bg-[#1e1e1e] hover:bg-[#252525] border border-[#2a2a2a] rounded-xl transition-all text-left active:scale-95 group"
                >
                  <div className="w-2 h-2 rounded-full shadow-lg" style={{ backgroundColor: preset.color }} />
                  <span className="text-[9px] text-gray-500 font-black group-hover:text-white uppercase truncate tracking-widest">{preset.name.split(' ')[1]}</span>
                </button>
              ))}
            </div>
          </section>

          <section className="space-y-12">
            <div>
              <h4 className="text-[10px] uppercase font-black text-gray-600 tracking-[0.4em] mb-8 border-b border-[#2a2a2a] pb-3">Iluminación HDR</h4>
              <ControlSlider label="Exposición" value={settings.exposure} min={-100} max={100} onChange={v => setSettings(s => ({...s, exposure: v}))} />
              <ControlSlider label="Contraste" value={settings.contrast} min={-100} max={100} onChange={v => setSettings(s => ({...s, contrast: v}))} />
              <ControlSlider label="Sombras" value={settings.shadows} min={-100} max={100} onChange={v => setSettings(s => ({...s, shadows: v}))} />
              <ControlSlider label="Altas Luces" value={settings.highlights} min={-100} max={100} onChange={v => setSettings(s => ({...s, highlights: v}))} />
            </div>

            <div>
              <h4 className="text-[10px] uppercase font-black text-gray-600 tracking-[0.4em] mb-8 border-b border-[#2a2a2a] pb-3">Color Master</h4>
              <ControlSlider label="Temperatura" value={settings.temp} min={-100} max={100} onChange={v => setSettings(s => ({...s, temp: v}))} />
              <ControlSlider label="Saturación" value={settings.saturation} min={-100} max={100} onChange={v => setSettings(s => ({...s, saturation: v}))} />
              <ControlSlider label="Intensidad" value={settings.vibrance} min={-100} max={100} onChange={v => setSettings(s => ({...s, vibrance: v}))} />
            </div>

            <div>
              <h4 className="text-[10px] uppercase font-black text-gray-600 tracking-[0.4em] mb-8 border-b border-[#2a2a2a] pb-3">Nitidez y Lente</h4>
              <ControlSlider label="Definición" value={settings.sharpness} min={0} max={100} onChange={v => setSettings(s => ({...s, sharpness: v}))} />
              <ControlSlider label="Viñeta" value={settings.vignette} min={-100} max={100} onChange={v => setSettings(s => ({...s, vignette: v}))} />
            </div>
          </section>

          <div className="mt-16 mb-10 space-y-4">
            <button 
              onClick={() => applyPreset('reset')}
              className="w-full py-4 text-[9px] font-black text-gray-500 hover:text-white bg-[#1e1e1e] border border-[#2a2a2a] rounded-2xl hover:bg-[#252525] transition-all uppercase tracking-[0.3em]"
            >
              Reiniciar Proyecto
            </button>
            <button 
              disabled={!image}
              onClick={handleDownload}
              className={`w-full py-5 text-[11px] font-black rounded-2xl flex items-center justify-center gap-3 transition-all uppercase tracking-[0.3em] shadow-xl
                ${image ? 'bg-white text-black hover:bg-orange-600 hover:text-white cursor-pointer active:scale-95' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
            >
              Exportar Master
            </button>
          </div>

          <footer className="mt-auto border-t border-[#2a2a2a] pt-10 text-center">
             <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.3em]">Creado por Christian Núñez V. 2026</p>
             <div className="flex justify-center items-center gap-2 mt-3">
               <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
               <p className="text-[8px] text-gray-700 uppercase tracking-[0.4em]">Engine v2.0.6 • Cloud Render Active</p>
             </div>
          </footer>
        </aside>
      </main>

      {/* Popups */}
      {toast && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 px-10 py-4 bg-orange-600 text-white text-[10px] font-black uppercase tracking-[0.3em] rounded-full shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-8 duration-300">
          {toast}
        </div>
      )}
    </div>
  );
};

export default App;
