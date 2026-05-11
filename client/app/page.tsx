'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PipelineEvent } from '@roshetta/shared/events.js';
import type { DecodedPrescription, MedicationEntry } from '@roshetta/shared/prescription.js';
import type { StageName } from '@roshetta/shared/pipeline.js';
import { submitPrescription, SubmissionError } from '@/lib/api';
import { Hero } from './components/Hero';
import { DrugSearch } from './components/DrugSearch';
import { Intake } from './components/Intake';
import { CameraModal } from './components/CameraModal';
import { PipelineStepper, type StageState } from './components/PipelineStepper';
import { ResultPanel } from './components/ResultPanel';
import { AlternativesDrawer } from './components/AlternativesDrawer';
import { Footer } from './components/Footer';
import { useCountry } from './components/CountryContext';
import { Alert } from '@/lib/icons';

function makeInitialStages(): Record<StageName, StageState> {
  return {
    preprocessor: { status: 'pending' },
    'ocr-reader': { status: 'pending' },
    'nlp-parser': { status: 'pending' },
    'alternatives-finder': { status: 'pending' },
  };
}

export default function Home() {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<{ file: Blob; name: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [stages, setStages] = useState<Record<StageName, StageState>>(makeInitialStages);
  const [totalDurationMs, setTotalDurationMs] = useState<number | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DecodedPrescription | null>(null);
  const [openMedId, setOpenMedId] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);

  const { countryCode, country } = useCountry();

  const stepperRef = useRef<HTMLDivElement | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const intakeRef = useRef<HTMLDivElement | null>(null);

  const resetStreamState = useCallback(() => {
    setStages(makeInitialStages());
    setError(null);
    setResult(null);
    setTotalDurationMs(undefined);
    setOpenMedId(null);
  }, []);

  const handleFilePicked = useCallback((file: Blob, name: string) => {
    if (imageSrc) URL.revokeObjectURL(imageSrc);
    setImageSrc(URL.createObjectURL(file));
    setPendingFile({ file, name });
    resetStreamState();
  }, [imageSrc, resetStreamState]);

  const handleClear = useCallback(() => {
    if (imageSrc) URL.revokeObjectURL(imageSrc);
    setImageSrc(null);
    setPendingFile(null);
    resetStreamState();
  }, [imageSrc, resetStreamState]);

  const handleEvent = useCallback((event: PipelineEvent) => {
    if (event.type === 'stage_start') {
      setStages((prev) => ({ ...prev, [event.stage]: { status: 'running' } }));
    } else if (event.type === 'stage_complete') {
      setStages((prev) => ({
        ...prev,
        [event.stage]: { status: 'done', durationMs: event.durationMs },
      }));
    } else if (event.type === 'pipeline_complete') {
      setResult(event.result);
      setTotalDurationMs(event.totalDurationMs);
    } else if (event.type === 'pipeline_error') {
      setError(event.message);
      if (event.stage) {
        setStages((prev) => ({ ...prev, [event.stage as StageName]: { status: 'failed' } }));
      }
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!pendingFile) return;
    resetStreamState();
    setIsProcessing(true);
    try {
      await submitPrescription(pendingFile.file, pendingFile.name, {
        onEvent: handleEvent,
        country: countryCode,
      });
    } catch (err) {
      const message =
        err instanceof SubmissionError ? err.message :
        err instanceof Error ? err.message :
        'Unexpected error.';
      setError(message);
    } finally {
      setIsProcessing(false);
    }
  }, [pendingFile, handleEvent, resetStreamState]);

  const handleCapture = useCallback((blob: Blob, filename: string) => {
    handleFilePicked(blob, filename);
    setCameraOpen(false);
  }, [handleFilePicked]);

  const openMed: MedicationEntry | null = useMemo(() => {
    if (!openMedId || !result) return null;
    return result.medications.find((m) => m.id === openMedId) ?? null;
  }, [openMedId, result]);

  const openAlternatives = openMedId && result
    ? result.alternativesByMedicationId[openMedId] ?? []
    : [];

  const showStepper = isProcessing || result !== null || error !== null;

  // Smooth-scroll to the reading progress when a submission starts so the user
  // doesn't have to chase the action.
  useEffect(() => {
    if (!isProcessing) return;
    const t = window.setTimeout(() => {
      stepperRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
    return () => window.clearTimeout(t);
  }, [isProcessing]);

  // Once the medication list arrives, scroll on to the results.
  useEffect(() => {
    if (!result) return;
    const t = window.setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 240);
    return () => window.clearTimeout(t);
  }, [result]);

  // When the user resets ("Read another"), return them to the intake card.
  const handleReset = useCallback(() => {
    handleClear();
    window.setTimeout(() => {
      intakeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
  }, [handleClear]);

  return (
    <>
      <main>
        <Hero />

        <DrugSearch />

        <div ref={intakeRef}>
          <Intake
            imageSrc={imageSrc}
            pendingFilename={pendingFile?.name ?? null}
            isProcessing={isProcessing}
            onFilePicked={handleFilePicked}
            onCameraOpen={() => setCameraOpen(true)}
            onSubmit={handleSubmit}
            onClear={handleClear}
          />
        </div>

        {showStepper ? (
          <div ref={stepperRef}>
            <PipelineStepper stages={stages} totalDurationMs={totalDurationMs} />
          </div>
        ) : null}

        {error ? (
          <div className="error-banner" role="alert">
            <Alert size={20} className="error-banner__icon" />
            <div className="error-banner__body">
              <div><strong>Something went wrong.</strong> {error}</div>
              <button className="btn btn--ghost error-banner__retry" onClick={handleSubmit}
                      disabled={!pendingFile || isProcessing}>
                Try again
              </button>
            </div>
          </div>
        ) : null}

        {result ? (
          <div ref={resultRef}>
            <ResultPanel
              result={result}
              country={country}
              onOpenAlternatives={(id) => setOpenMedId(id)}
              onReset={handleReset}
            />
          </div>
        ) : null}
      </main>

      <Footer />

      <CameraModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCapture={handleCapture}
      />

      <AlternativesDrawer
        medication={openMed}
        alternatives={openAlternatives}
        onClose={() => setOpenMedId(null)}
      />
    </>
  );
}
