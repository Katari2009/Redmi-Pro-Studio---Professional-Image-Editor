
export interface EditorSettings {
  exposure: number;
  contrast: number;
  shadows: number;
  highlights: number;
  whites: number;
  temp: number;
  tint: number;
  saturation: number;
  vibrance: number;
  sharpness: number;
  clarity: number;
  vignette: number;
}

export type PresetType = 
  | 'natgeo' 
  | 'sony' 
  | 'cinematic' 
  | 'clean' 
  | 'hdr' 
  | 'drone' 
  | 'automotive' 
  | 'moon' 
  | 'night' 
  | 'selfie'
  | 'reset';

export interface PresetConfig {
  name: string;
  color: string;
  settings: Partial<EditorSettings>;
}
