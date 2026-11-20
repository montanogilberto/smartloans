import React, { useCallback, useRef, useState } from 'react';
import { IonIcon, IonSpinner } from '@ionic/react';
import { cameraOutline, helpCircleOutline, personOutline } from 'ionicons/icons';
import { Camera, CameraDirection, CameraResultType, CameraSource } from '@capacitor/camera';
import { computeCaptureSharpness, detectCardBounds } from '../../utils/documentCaptureAnalysis';
import './GuidedDocumentCapture.css';

// ID capture through the phone's own camera app instead of a WebView
// getUserMedia preview. The WebView stream never focused on a card a few cm
// away on several Android devices (focusMode / pointsOfInterest are ignored by
// many camera stacks), while the native camera app has real autofocus and
// tap-to-focus. The card is then located in the photo and cropped, giving the
// same outputs as the live capture: the ~1100px OCR image and a 2400px crop
// for the face match.

interface NativeDocumentCaptureProps {
  title: string;
  instructions: string;
  onCapture: (base64: string, highResBase64?: string) => void;
  onHelp?: () => void;
}

// Same targets as GuidedDocumentCapture (see the notes there): ~300 DPI for OCR
// and a larger crop for the INE-portrait comparison.
const MAX_OUTPUT_WIDTH = 1100;
const HI_RES_WIDTH = 2400;
const MIN_CAPTURE_SHARPNESS = 480;
// After this many rejected photos the next one is accepted anyway: a camera
// that never clears the gate must not block onboarding.
const FORCE_AFTER_REJECTIONS = 2;
// Card-finding runs on a small copy of the photo.
const ANALYSIS_WIDTH = 480;
// Caps the decoded photo so a 50 MP sensor doesn't exhaust WebView memory.
const MAX_PHOTO_SIDE = 3200;

interface ProcessedPhoto {
  base64: string;
  highResBase64: string;
  cardFound: boolean;
  sharpness: number;
}

function loadImage(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('No se pudo leer la foto'));
    img.src = dataUrl;
  });
}

function drawCrop(
  img: HTMLImageElement,
  crop: { x: number; y: number; w: number; h: number },
  maxWidth: number,
): HTMLCanvasElement {
  const scale = Math.min(1, maxWidth / crop.w);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(crop.w * scale);
  canvas.height = Math.round(crop.h * scale);
  canvas.getContext('2d')?.drawImage(img, crop.x, crop.y, crop.w, crop.h, 0, 0, canvas.width, canvas.height);
  return canvas;
}

async function processPhoto(dataUrl: string): Promise<ProcessedPhoto> {
  const img = await loadImage(dataUrl);
  const srcW = img.naturalWidth;
  const srcH = img.naturalHeight;

  const analysis = document.createElement('canvas');
  analysis.width = ANALYSIS_WIDTH;
  analysis.height = Math.round((ANALYSIS_WIDTH * srcH) / srcW);
  const actx = analysis.getContext('2d', { willReadFrequently: true });
  if (!actx) throw new Error('Canvas no disponible');
  actx.drawImage(img, 0, 0, analysis.width, analysis.height);
  const bounds = detectCardBounds(actx.getImageData(0, 0, analysis.width, analysis.height));

  const crop = bounds
    ? { x: bounds.x * srcW, y: bounds.y * srcH, w: bounds.width * srcW, h: bounds.height * srcH }
    : { x: 0, y: 0, w: srcW, h: srcH };

  const ocrCanvas = drawCrop(img, crop, MAX_OUTPUT_WIDTH);
  const octx = ocrCanvas.getContext('2d', { willReadFrequently: true });
  const sharpness = octx ? computeCaptureSharpness(octx.getImageData(0, 0, ocrCanvas.width, ocrCanvas.height)) : 0;

  console.log('[NativeDocumentCapture] processed', JSON.stringify({
    source: `${srcW}x${srcH}`,
    cardFound: !!bounds,
    crop: `${Math.round(crop.w)}x${Math.round(crop.h)}`,
    output: `${ocrCanvas.width}x${ocrCanvas.height}`,
    sharpness: Math.round(sharpness),
    minRequired: MIN_CAPTURE_SHARPNESS,
  }));

  return {
    base64: ocrCanvas.toDataURL('image/jpeg', 0.92),
    highResBase64: drawCrop(img, crop, HI_RES_WIDTH).toDataURL('image/jpeg', 0.95),
    cardFound: !!bounds,
    sharpness,
  };
}

const NativeDocumentCapture: React.FC<NativeDocumentCaptureProps> = ({ title, instructions, onCapture, onHelp }) => {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const rejectionsRef = useRef(0);

  const takePhoto = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    setMessage('');
    try {
      const photo = await Camera.getPhoto({
        source: CameraSource.Camera,
        direction: CameraDirection.Rear,
        resultType: CameraResultType.DataUrl,
        quality: 95,
        correctOrientation: true,
        saveToGallery: false,
        allowEditing: false,
        width: MAX_PHOTO_SIDE,
        height: MAX_PHOTO_SIDE,
      });
      if (!photo.dataUrl) {
        setMessage('No se recibió la foto. Inténtalo de nuevo.');
        return;
      }
      const result = await processPhoto(photo.dataUrl);

      const tooBlurry = result.cardFound && result.sharpness < MIN_CAPTURE_SHARPNESS;
      const canRetry = rejectionsRef.current < FORCE_AFTER_REJECTIONS;
      if ((tooBlurry || !result.cardFound) && canRetry) {
        rejectionsRef.current += 1;
        setMessage(
          tooBlurry
            ? 'La foto salió borrosa. En la cámara, toca la credencial para enfocar y espera un momento antes de disparar.'
            : 'No encontramos la credencial en la foto. Colócala sobre una superficie oscura y que llene casi toda la foto.',
        );
        return;
      }
      if (tooBlurry || !result.cardFound) {
        console.warn('[NativeDocumentCapture] accepted after', rejectionsRef.current, 'rejections; extraction may need manual correction');
      }
      rejectionsRef.current = 0;
      onCapture(result.base64, result.highResBase64);
    } catch (err) {
      // Closing the camera without shooting also lands here.
      console.log('[NativeDocumentCapture] camera closed or failed —', String(err));
      setMessage('No se tomó la foto. Toca "Tomar foto" para intentarlo de nuevo.');
    } finally {
      setBusy(false);
    }
  }, [busy, onCapture]);

  return (
    <div className="gdc-root gdc-root--native">
      <div className="gdc-header">
        <h2 className="gdc-title">{title}</h2>
        <p className="gdc-instructions">{instructions}</p>
      </div>

      <div className="gdc-native-body">
        <div className="gdc-native-card">
          <div className="gdc-id-illustration">
            <IonIcon icon={personOutline} className="gdc-id-avatar" />
            <div className="gdc-id-lines">
              <span className="gdc-id-line gdc-id-line--wide" />
              <span className="gdc-id-line" />
              <span className="gdc-id-line gdc-id-line--short" />
            </div>
          </div>
        </div>
        <ul className="gdc-native-tips">
          <li>Pon la credencial sobre una superficie oscura.</li>
          <li>Que la credencial llene casi toda la foto.</li>
          <li>Toca la credencial en la pantalla para enfocar.</li>
          <li>Evita reflejos de luz.</li>
        </ul>
      </div>

      {message && <div className="gdc-focus-message" role="alert">{message}</div>}

      <div className="gdc-controls">
        <button
          type="button"
          className="gdc-control-button gdc-control-button--primary"
          onClick={takePhoto}
          disabled={busy}
        >
          {busy ? <IonSpinner name="crescent" className="gdc-button-spinner" /> : <IonIcon icon={cameraOutline} />}
          {busy ? 'Procesando…' : 'Tomar foto'}
        </button>
        {onHelp && (
          <button type="button" className="gdc-control-button" onClick={onHelp} disabled={busy}>
            <IonIcon icon={helpCircleOutline} /> Ayuda
          </button>
        )}
      </div>
    </div>
  );
};

export default NativeDocumentCapture;
