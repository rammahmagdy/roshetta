'use client';

import { useState, type DragEvent } from 'react';
import { Camera, UploadCloud, Lightbulb, Pill, Sparkles } from '@/lib/icons';
import { DrugSearch } from './DrugSearch';

type Mode = 'upload' | 'camera' | 'search';

interface IntakeProps {
  imageSrc: string | null;
  pendingFilename: string | null;
  isProcessing: boolean;
  onFilePicked: (file: Blob, name: string) => void;
  onCameraOpen: () => void;
  onSubmit: () => void;
  onClear: () => void;
}

export function Intake({
  imageSrc,
  pendingFilename,
  isProcessing,
  onFilePicked,
  onCameraOpen,
  onSubmit,
  onClear,
}: IntakeProps) {
  const [mode, setMode] = useState<Mode>('upload');
  const [isDrag, setIsDrag] = useState(false);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f) onFilePicked(f, f.name);
  };

  return (
    <section className="section">
      <div className="card card--featured">
        <div role="tablist" aria-label="Submission method" className="intake__segments">
          <button
            type="button"
            role="tab"
            aria-pressed={mode === 'upload'}
            className="intake__segment"
            onClick={() => setMode('upload')}
          >
            <UploadCloud size={15} />
            <span className="btn__copy">
              <span className="btn__main">Upload</span>
              <span className="btn__alt" lang="ar" dir="rtl">ارفع صورة</span>
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-pressed={mode === 'camera'}
            className="intake__segment"
            onClick={() => setMode('camera')}
          >
            <Camera size={15} />
            <span className="btn__copy">
              <span className="btn__main">Camera</span>
              <span className="btn__alt" lang="ar" dir="rtl">كاميرا</span>
            </span>
          </button>
          <button
            type="button"
            role="tab"
            aria-pressed={mode === 'search'}
            className="intake__segment"
            onClick={() => setMode('search')}
          >
            <Pill size={15} />
            <span className="btn__copy">
              <span className="btn__main">By name</span>
              <span className="btn__alt" lang="ar" dir="rtl">باسم الدوا</span>
            </span>
          </button>
        </div>

        {mode === 'upload' ? (
          <label
            className={`dropzone${isDrag ? ' is-drag' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDrag(true); }}
            onDragLeave={() => setIsDrag(false)}
            onDrop={handleDrop}
          >
            <span className="dropzone__icon" aria-hidden>
              <UploadCloud size={28} />
            </span>
            <span className="dropzone__title">Add your prescription photo</span>
            <span className="dropzone__title-ar" lang="ar" dir="rtl">ضع صورة الروشتة</span>
            <span className="dropzone__hint">Drop it here, or click to choose.</span>
            <span className="dropzone__hint-ar" lang="ar" dir="rtl">اسحبها هنا أو اضغط للاختيار.</span>
            <span className="dropzone__formats" aria-hidden>
              <span className="format-tag">JPEG</span>
              <span className="format-tag">PNG</span>
              <span className="format-tag">HEIC</span>
              <span className="format-tag">PDF</span>
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/heic,image/heif,application/pdf"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onFilePicked(f, f.name);
              }}
              aria-label="Upload prescription image"
            />
          </label>
        ) : mode === 'camera' ? (
          <div className="dropzone" onClick={onCameraOpen} role="button" tabIndex={0}
               onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onCameraOpen(); }}>
            <span className="dropzone__icon" aria-hidden>
              <Camera size={28} />
            </span>
            <span className="dropzone__title">Take a photo</span>
            <span className="dropzone__title-ar" lang="ar" dir="rtl">صوّر الروشتة</span>
            <span className="dropzone__hint">Best in even, daylight-bright lighting.</span>
            <span className="dropzone__hint-ar" lang="ar" dir="rtl">الإضاءة الطبيعية أحسن نتيجة.</span>
            <button className="btn btn--primary" type="button" onClick={(e) => { e.stopPropagation(); onCameraOpen(); }}>
              <Camera size={15} />
              <span className="btn__copy">
                <span className="btn__main">Open camera</span>
                <span className="btn__alt" lang="ar" dir="rtl">افتح الكاميرا</span>
              </span>
            </button>
          </div>
        ) : (
          // mode === 'search' — search by name (LLM + local fuzzy)
          <DrugSearch embedded />
        )}

        {mode !== 'search' ? (
        <div className="tips stagger">
          <div className="tip">
            <Lightbulb className="tip__icon" />
            <div>
              <div>Lay the paper flat. Avoid shadows on the writing.</div>
              <div lang="ar" dir="rtl" style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 2 }}>
                افرد الورقة وأبعد الظل عن الكتابة.
              </div>
            </div>
          </div>
          <div className="tip">
            <Sparkles className="tip__icon" />
            <div>
              <div>Get close. Fill the photo with the medication lines.</div>
              <div lang="ar" dir="rtl" style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 2 }}>
                قرّب الكاميرا حتى تظهر سطور الأدوية واضحة.
              </div>
            </div>
          </div>
        </div>
        ) : null}

        {mode !== 'search' && imageSrc ? (
          <div className="preview-row">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageSrc} alt={pendingFilename ?? 'Selected prescription'} className="preview-row__img" />
            <div className="preview-row__meta">
              <div>
                <div className="preview-row__title">
                  Ready to read
                  <span lang="ar" dir="rtl" style={{ display: 'block', fontFamily: 'var(--font-arabic)', fontSize: 13, fontWeight: 500, color: 'var(--ink-dim)', marginTop: 2 }}>
                    جاهزة للقراءة
                  </span>
                </div>
                <div className="preview-row__filename">{pendingFilename}</div>
              </div>
              <div className="preview-row__actions">
                <button className="btn btn--primary btn--lg" onClick={onSubmit} disabled={isProcessing}>
                  <span className="btn__copy">
                    <span className="btn__main">{isProcessing ? 'Reading…' : 'Read prescription'}</span>
                    <span className="btn__alt" lang="ar" dir="rtl">{isProcessing ? 'جاري القراءة…' : 'اقرأ الروشتة'}</span>
                  </span>
                </button>
                <button className="btn btn--ghost" onClick={onClear} disabled={isProcessing}>
                  <span className="btn__copy">
                    <span className="btn__main">Choose another</span>
                    <span className="btn__alt" lang="ar" dir="rtl">صورة تانية</span>
                  </span>
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
