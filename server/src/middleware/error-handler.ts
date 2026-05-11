import type { ErrorRequestHandler } from 'express';
import multer from 'multer';

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({ error: 'File too large. Maximum allowed size is 10 MB.' });
      return;
    }
    res.status(400).json({ error: `Upload error: ${err.code}` });
    return;
  }

  if (err instanceof Error && err.message.startsWith('UNSUPPORTED_MIME:')) {
    const mime = err.message.split(':')[1];
    res.status(400).json({
      error: `Unsupported file type "${mime}". Please upload a JPEG, PNG, HEIC image, or PDF.`,
    });
    return;
  }

  // Generic fallback. Never leak stack traces to the client.
  console.error('[roshetta] unhandled error', err);
  if (!res.headersSent) {
    res.status(500).json({ error: 'Unexpected server error.' });
  }
};
