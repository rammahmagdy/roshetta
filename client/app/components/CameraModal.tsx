'use client';

import { useEffect, useRef, useState } from 'react';
import { startCamera, type CameraSession, CameraError } from '@/lib/camera';
import { Camera, X } from '@/lib/icons';

interface CameraModalProps {
  open: boolean;
  onClose: () => void;
  onCapture: (blob: Blob, filename: string) => void;
}

export function CameraModal({ open, onClose, onCapture }: CameraModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const sessionRef = useRef<CameraSession | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    let cancelled = false;
    (async () => {
      // Wait one tick so the <video> mounts.
      await new Promise((r) => setTimeout(r, 0));
      if (!videoRef.current || cancelled) return;
      try {
        sessionRef.current = await startCamera(videoRef.current);
      } catch (err) {
        if (err instanceof CameraError) setError(err.message);
        else setError('Could not start camera.');
      }
    })();
    return () => {
      cancelled = true;
      sessionRef.current?.stop();
      sessionRef.current = null;
    };
  }, [open]);

  if (!open) return null;

  const handleCapture = async () => {
    if (!sessionRef.current) return;
    try {
      const blob = await sessionRef.current.capture();
      onCapture(blob, `capture-${Date.now()}.jpg`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Capture failed.');
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-label="Camera capture">
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <div className="modal__title">
            <Camera size={16} style={{ marginRight: 6, verticalAlign: -3 }} />
            Capture prescription
          </div>
          <button className="drawer__close" type="button" onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>
        <div className="modal__body">
          {error ? (
            <div className="error-banner" role="alert">
              <span className="error-banner__icon">⚠</span>
              <div className="error-banner__body">
                <div>{error}</div>
              </div>
            </div>
          ) : (
            <video ref={videoRef} className="camera-video" playsInline muted />
          )}
        </div>
        <div className="modal__foot">
          <button className="btn btn--ghost" type="button" onClick={onClose}>Cancel</button>
          <button className="btn" type="button" onClick={handleCapture} disabled={!!error}>
            <Camera size={16} /> Capture frame
          </button>
        </div>
      </div>
    </div>
  );
}
