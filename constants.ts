
import { EditorSettings, PresetConfig } from './types';

export const INITIAL_SETTINGS: EditorSettings = {
  exposure: 0,
  contrast: 0,
  shadows: 0,
  highlights: 0,
  whites: 0,
  temp: 0,
  tint: 0,
  saturation: 0,
  vibrance: 0,
  sharpness: 0,
  clarity: 0,
  vignette: 0
};

export const PRESETS: Record<string, PresetConfig> = {
  natgeo: {
    name: '🌍 Nat Geo',
    color: '#8BC34A',
    settings: { contrast: 15, shadows: 20, highlights: -30, clarity: 20, saturation: 10, vibrance: 15, temp: 10 }
  },
  sony: {
    name: '🏆 Sony Award',
    color: '#2196F3',
    settings: { exposure: 5, contrast: 20, highlights: -50, shadows: 30, whites: 10, clarity: 10, sharpness: 30, temp: -10 }
  },
  cinematic: {
    name: '🎬 Cinematic',
    color: '#9C27B0',
    settings: { contrast: 25, shadows: -20, highlights: -10, saturation: -15, temp: -20, tint: 10, vignette: 60, clarity: 30 }
  },
  clean: {
    name: '✨ Clean Pro',
    color: '#FFFFFF',
    settings: { exposure: 0, contrast: 5, shadows: 10, highlights: -10, clarity: 10, sharpness: 10 }
  },
  hdr: {
    name: '⚡ HDR+ Pro',
    color: '#FF9800',
    settings: { highlights: -40, shadows: 40, whites: 10, contrast: 15, clarity: 25, vibrance: 15, sharpness: 10 }
  },
  drone: {
    name: '🚁 Drone/Dehaze',
    color: '#00BCD4',
    settings: { contrast: 30, clarity: 45, saturation: 20, vibrance: 40, highlights: -15, shadows: 10, sharpness: 25 }
  },
  automotive: {
    name: '🚗 Automotriz',
    color: '#607D8B',
    settings: { clarity: 35, contrast: 15, sharpness: 40, highlights: -25, exposure: 5, temp: -5 }
  },
  moon: {
    name: '🌑 Luna/Estrellas',
    color: '#3F51B5',
    settings: { exposure: 10, contrast: 40, shadows: -60, highlights: -40, clarity: 50, sharpness: 60, temp: -10 }
  },
  night: {
    name: '🌃 Modo Nocturno',
    color: '#673AB7',
    settings: { exposure: 20, shadows: 50, highlights: -15, contrast: 10, clarity: 15, saturation: 10, temp: -5, tint: 5 }
  },
  selfie: {
    name: '🤳 Selfie/Retrato',
    color: '#E91E63',
    settings: { exposure: 5, contrast: -10, shadows: 15, highlights: -15, clarity: -35, sharpness: 20, saturation: -5, vignette: 30 }
  }
};
