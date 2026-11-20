import React, { useState } from 'react';
import ZoomableImage from './ZoomableImage';
import { frontSelfieUrl } from '../../utils/selfie';

/** src = the front-facing KYC pose; onError falls back to the stored selfie (older KYCs). */
export const useFrontSelfie = (selfieUrl?: string | null) => {
  const front = frontSelfieUrl(selfieUrl);
  const [failed, setFailed] = useState<string | null>(null);
  const src = front && failed !== front ? front : selfieUrl ?? undefined;
  const onError = () => { if (front && src === front && front !== selfieUrl) setFailed(front); };
  return { src, onError };
};

interface SelfieImageProps {
  /** The client's clientSelfieBlobUrl. */
  url: string;
  alt: string;
  className?: string;
  /** Tap-to-zoom with a replace action (the dashboard's own avatar). */
  replaceLabel?: string;
  onReplace?: () => void;
}

/** A person's KYC photo, front-facing when available. */
const SelfieImage: React.FC<SelfieImageProps> = ({ url, alt, className, replaceLabel, onReplace }) => {
  const { src, onError } = useFrontSelfie(url);
  if (!src) return null;
  return onReplace
    ? <ZoomableImage src={src} alt={alt} className={className} replaceLabel={replaceLabel} onReplace={onReplace} onError={onError} />
    : <img src={src} alt={alt} className={className} onError={onError} />;
};

export default SelfieImage;
