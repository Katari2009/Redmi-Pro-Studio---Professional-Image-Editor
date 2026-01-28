
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { EditorSettings, PresetType } from './types';
import { INITIAL_SETTINGS, PRESETS } from './constants';
import { processImage } from './services/imageProcessor';

// Components
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
    showToast('Imagen descargada en alta resolución');
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
      showToast(`Perfil ${preset.name} aplicado`);
    }
  };

  const analyzeWithAI = async () => {
    if (!image || !canvasRef.current) return;
    
    setIsAIAnalyzing(true);
    showToast('Gemini analizando imagen...');
    
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Image = canvasRef.current.toDataURL('image/jpeg', 0.5).split(',')[1];
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            parts: [
              { text: "Analyze this image and provide professional retouching slider values. Return ONLY a JSON object with keys: exposure, contrast, shadows, highlights, whites, temp, tint, saturation, vibrance, sharpness, clarity, vignette. Values should be integers from -100 to 100 (except sharpness 0 to 100). Aim for a 'Masterpiece' aesthetic." },
              { inlineData: { mimeType: 'image/jpeg', data: base64Image } }
            ]
          }
        ],
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

      const aiSettings = JSON.parse(response.text);
      setSettings(aiSettings);
      showToast('✨ IA: Optimización completada');
    } catch (error) {
      console.error(error);
      showToast('Error al conectar con la IA');
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
      {/* Header - Responsive stack on tiny screens */}
      <header className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-3 bg-[#1e1e1e] border-b border-[#333] z-20 gap-3 sm:gap-0">
        <div className="flex items-center gap-3">
          <div className="bg-orange-600 p-1.5 rounded-lg shadow-lg shadow-orange-900/20">
            <svg className="w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
            Redmi Pro Studio <span className="ml-1 px-1.5 py-0.5 bg-orange-600 text-[9px] font-black rounded uppercase align-middle">PRO</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-semibold rounded-md transition-all active:scale-95 shadow-md shadow-orange-900/10"
          >
            <span>📂 Abrir</span>
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

      {/* Main Layout - Column on mobile, Row on desktop */}
      <main className="flex flex-col md:flex-row flex-1 overflow-hidden relative">
        
        {/* Canvas Area - Dynamic height on mobile */}
        <div className="flex-[1.2] md:flex-1 bg-[#0a0a0a] flex items-center justify-center p-4 sm:p-8 overflow-auto relative min-h-[40vh] md:min-h-0">
          {!image && (
            <div className="text-center space-y-4 max-w-sm pointer-events-none p-6">
              <div className="text-gray-700 flex justify-center">
                <svg className="w-16 h-16 sm:w-20 sm:h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-medium text-gray-500">Selecciona una fotografía</h3>
              <p className="text-gray-600 text-xs italic">Soporta formatos JPEG, PNG y WebP en alta definición</p>
            </div>
          )}
          <canvas 
            ref={canvasRef} 
            className={`max-w-full max-h-full shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-opacity duration-300 ${image ? 'opacity-100' : 'opacity-0'}`}
          />
        </div>

        {/* Sidebar Controls - Full width on mobile scrollable, Fixed on desktop */}
        <aside className="w-full md:w-[360px] bg-[#1e1e1e] border-t md:border-t-0 md:border-l border-[#333] flex flex-col h-auto md:h-full overflow-y-auto p-5 sm:p-6 scroll-smooth z-10 shadow-2xl">
          
          {/* AI Helper Button */}
          <button 
            disabled={!image || isAIAnalyzing}
            onClick={analyzeWithAI}
            className={`w-full mb-6 sm:mb-8 py-3.5 rounded-xl flex items-center justify-center gap-3 font-bold text-[11px] uppercase tracking-wider transition-all
              ${image ? 'bg-indigo-600 hover:bg-indigo-700 text-white cursor-pointer active:scale-[0.98] shadow-lg shadow-indigo-900/20' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}
              ${isAIAnalyzing ? 'animate-pulse' : ''}`}
          >
            <span className="text-lg">✨</span>
            {isAIAnalyzing ? 'Analizando...' : 'Retoque Mágico AI'}
          </button>

          {/* Presets Grid */}
          <section className="mb-8">
            <h4 className="text-[10px] uppercase font-black text-gray-500 tracking-[0.2em] mb-4 border-b border-[#333] pb-2">Estilos Rápidos</h4>
            <div className="grid grid-cols-2 xs:grid-cols-3 md:grid-cols-2 gap-2">
              {Object.entries(PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  onClick={() => applyPreset(key as PresetType)}
                  className="flex items-center gap-2.5 px-3 py-2.5 bg-[#252525] hover:bg-[#333] border border-[#333] rounded-lg transition-all text-left group active:scale-95"
                >
                  <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: preset.color }} />
                  <span className="text-[11px] text-gray-400 font-medium group-hover:text-white truncate uppercase">{preset.name.split(' ')[1]}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Sliders Groups */}
          <section className="space-y-10">
            <div>
              <h4 className="text-[10px] uppercase font-black text-gray-500 tracking-[0.2em] mb-5 border-b border-[#333] pb-2">Revelado Básico</h4>
              <ControlSlider label="Exposición" value={settings.exposure} min={-100} max={100} onChange={v => setSettings(s => ({...s, exposure: v}))} />
              <ControlSlider label="Contraste" value={settings.contrast} min={-100} max={100} onChange={v => setSettings(s => ({...s, contrast: v}))} />
              <ControlSlider label="Sombras" value={settings.shadows} min={-100} max={100} onChange={v => setSettings(s => ({...s, shadows: v}))} />
              <ControlSlider label="Altas Luces" value={settings.highlights} min={-100} max={100} onChange={v => setSettings(s => ({...s, highlights: v}))} />
              <ControlSlider label="Blancos" value={settings.whites} min={-100} max={100} onChange={v => setSettings(s => ({...s, whites: v}))} />
            </div>

            <div>
              <h4 className="text-[10px] uppercase font-black text-gray-500 tracking-[0.2em] mb-5 border-b border-[#333] pb-2">Balance Cromático</h4>
              <ControlSlider label="Temperatura" value={settings.temp} min={-100} max={100} onChange={v => setSettings(s => ({...s, temp: v}))} />
              <ControlSlider label="Tinte" value={settings.tint} min={-100} max={100} onChange={v => setSettings(s => ({...s, tint: v}))} />
              <ControlSlider label="Saturación" value={settings.saturation} min={-100} max={100} onChange={v => setSettings(s => ({...s, saturation: v}))} />
              <ControlSlider label="Vibrancia" value={settings.vibrance} min={-100} max={100} onChange={v => setSettings(s => ({...s, vibrance: v}))} />
            </div>

            <div>
              <h4 className="text-[10px] uppercase font-black text-gray-500 tracking-[0.2em] mb-5 border-b border-[#333] pb-2">Detalle y Estilo</h4>
              <ControlSlider label="Nitidez" value={settings.sharpness} min={0} max={100} onChange={v => setSettings(s => ({...s, sharpness: v}))} />
              <ControlSlider label="Claridad" value={settings.clarity} min={-100} max={100} onChange={v => setSettings(s => ({...s, clarity: v}))} />
              <ControlSlider label="Viñeta" value={settings.vignette} min={-100} max={100} onChange={v => setSettings(s => ({...s, vignette: v}))} />
            </div>
          </section>

          {/* Action Buttons */}
          <div className="mt-12 mb-6 space-y-3">
            <button 
              onClick={() => applyPreset('reset')}
              className="w-full py-3 text-[10px] font-bold text-gray-400 hover:text-white bg-[#252525] border border-[#333] rounded-lg hover:bg-[#333] transition-all uppercase tracking-widest"
            >
              ↺ Resetear Ajustes
            </button>
            <button 
              disabled={!image}
              onClick={handleDownload}
              className={`w-full py-4 text-xs font-black rounded-xl flex items-center justify-center gap-2 transition-all uppercase tracking-widest shadow-xl
                ${image ? 'bg-white text-black hover:bg-gray-200 cursor-pointer active:scale-95' : 'bg-gray-800 text-gray-600 cursor-not-allowed'}`}
            >
              💾 Exportar Resultado
            </button>
          </div>

          <footer className="mt-4 pb-8 border-t border-[#333] pt-6 text-center">
             <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.15em]">Creado por Christian Núñez V. 2026</p>
             <p className="text-[8px] text-gray-700 mt-1 uppercase tracking-widest">Profesional Image Processing Suite</p>
          </footer>
        </aside>
      </main>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 px-8 py-3 bg-orange-600 text-white text-[11px] font-black uppercase tracking-widest rounded-full shadow-[0_10px_30px_rgba(234,88,12,0.4)] z-50 animate-bounce">
          {toast}
        </div>
      )}
    </div>
  );
};

export default App;
