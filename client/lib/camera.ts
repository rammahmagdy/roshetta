export interface CameraSession {
  stream: MediaStream;
  stop(): void;
  capture(): Promise<Blob>;
}

export class CameraError extends Error {
  constructor(public readonly kind: 'unsupported' | 'denied' | 'failed', message: string) {
    super(message);
    this.name = 'CameraError';
  }
}

export async function startCamera(video: HTMLVideoElement): Promise<CameraSession> {
  if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
    throw new CameraError('unsupported', 'Camera capture is not supported in this browser.');
  }
  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false,
    });
  } catch (err) {
    const name = err instanceof Error ? err.name : '';
    if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
      throw new CameraError('denied', 'Camera permission was denied. You can still upload a file.');
    }
    throw new CameraError('failed', 'Could not access the camera. You can still upload a file.');
  }

  video.srcObject = stream;
  await video.play();

  return {
    stream,
    stop() {
      stream.getTracks().forEach((t) => t.stop());
      video.srcObject = null;
    },
    async capture(): Promise<Blob> {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new CameraError('failed', 'Could not capture frame.');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      return await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new CameraError('failed', 'Could not encode captured frame.'));
        }, 'image/jpeg', 0.9);
      });
    },
  };
}
