
import { EditorSettings } from '../types';

export const processImage = (
  ctx: CanvasRenderingContext2D,
  originalImage: HTMLImageElement,
  settings: EditorSettings
) => {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;

  // Reset and draw base
  ctx.drawImage(originalImage, 0, 0, w, h);

  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  const len = data.length;

  const exposureMult = Math.pow(2, settings.exposure / 100);
  const contrastFactor = (259 * (settings.contrast + 255)) / (255 * (259 - settings.contrast));
  
  const rTemp = settings.temp > 0 ? settings.temp * 0.5 : 0;
  const bTemp = settings.temp < 0 ? -settings.temp * 0.5 : 0;
  const gTint = settings.tint > 0 ? settings.tint * 0.3 : 0;
  const mTint = settings.tint < 0 ? -settings.tint * 0.3 : 0; 

  const satMult = 1 + (settings.saturation / 100);
  const vibMult = 1 + (settings.vibrance / 100);
  
  const shadowLift = settings.shadows / 100; 
  const highlightDrop = settings.highlights / 100;
  const whiteLift = settings.whites / 100;

  for (let i = 0; i < len; i += 4) {
    let r = data[i];
    let g = data[i+1];
    let b = data[i+2];

    // 1. Exposure
    if (settings.exposure !== 0) {
      r *= exposureMult;
      g *= exposureMult;
      b *= exposureMult;
    }

    // 2. White Balance
    if (settings.temp !== 0) {
      r += rTemp;
      b += bTemp;
    }
    if (settings.tint !== 0) {
      g += gTint;
      r += mTint;
      b += mTint;
    }

    // 3. Tone Curve Logic
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;

    if (settings.shadows !== 0) {
      const mask = 1 - (lum / 255); 
      const lift = mask * shadowLift * 80; 
      r += lift; g += lift; b += lift;
    }

    if (settings.highlights !== 0) {
      const mask = lum / 255; 
      const drop = mask * highlightDrop * 80;
      r += drop; g += drop; b += drop;
    }
    
    if (settings.whites !== 0) {
      if (lum > 200) {
        const lift = whiteLift * 50;
        r += lift; g += lift; b += lift;
      }
    }

    if (settings.contrast !== 0) {
      r = contrastFactor * (r - 128) + 128;
      g = contrastFactor * (g - 128) + 128;
      b = contrastFactor * (b - 128) + 128;
    }

    r = Math.max(0, Math.min(255, r));
    g = Math.max(0, Math.min(255, g));
    b = Math.max(0, Math.min(255, b));

    // 4. Color: Saturation & Vibrance
    if (settings.saturation !== 0 || settings.vibrance !== 0) {
      const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
      
      if (settings.vibrance !== 0) {
        const maxC = Math.max(r, Math.max(g, b));
        const avgC = (r + g + b) / 3;
        const amt = ((Math.abs(maxC - avgC) * 2) / 255) * 0.5; 
        if(settings.vibrance > 0) {
          r = r + (r - gray) * (vibMult - 1) * (1 - amt);
          g = g + (g - gray) * (vibMult - 1) * (1 - amt);
          b = b + (b - gray) * (vibMult - 1) * (1 - amt);
        } else {
          r = r + (r - gray) * (vibMult - 1);
          g = g + (g - gray) * (vibMult - 1);
          b = b + (b - gray) * (vibMult - 1);
        }
      }

      if (settings.saturation !== 0) {
        r = gray + (r - gray) * satMult;
        g = gray + (g - gray) * satMult;
        b = gray + (b - gray) * satMult;
      }
    }

    data[i] = r;
    data[i+1] = g;
    data[i+2] = b;
  }

  ctx.putImageData(imageData, 0, 0);

  // Post-process Effects
  if (settings.clarity !== 0) {
    const amt = settings.clarity / 100; 
    if (amt > 0) {
      ctx.globalCompositeOperation = 'overlay';
      ctx.fillStyle = `rgba(128,128,128,${amt * 0.4})`;
      ctx.fillRect(0,0,w,h);
      ctx.globalCompositeOperation = 'source-over';
    } else {
      ctx.filter = `blur(${Math.abs(amt)*2}px)`;
      ctx.drawImage(ctx.canvas, 0, 0);
      ctx.filter = 'none';
      ctx.globalAlpha = 0.5 + (amt * 0.4); 
      ctx.drawImage(originalImage, 0, 0, w, h);
      ctx.globalAlpha = 1.0;
    }
  }

  if (settings.sharpness > 0) {
    const amount = settings.sharpness / 400; 
    ctx.globalCompositeOperation = 'overlay'; 
    ctx.globalAlpha = amount;
    ctx.drawImage(ctx.canvas, 0, 0);
    ctx.globalAlpha = 1.0;
    ctx.globalCompositeOperation = 'source-over';
  }

  if (settings.vignette !== 0) {
    const gradient = ctx.createRadialGradient(w/2, h/2, w/3, w/2, h/2, Math.max(w,h)/1.2);
    const alpha = Math.abs(settings.vignette) / 100 * 0.8;
    
    if (settings.vignette < 0) {
      gradient.addColorStop(0, `rgba(255,255,255,0)`);
      gradient.addColorStop(1, `rgba(255,255,255,${alpha})`);
      ctx.globalCompositeOperation = 'screen';
    } else {
      gradient.addColorStop(0, `rgba(0,0,0,0)`);
      gradient.addColorStop(1, `rgba(0,0,0,${alpha})`);
      ctx.globalCompositeOperation = 'multiply'; 
    }
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0,0,w,h);
    ctx.globalCompositeOperation = 'source-over';
  }
};
