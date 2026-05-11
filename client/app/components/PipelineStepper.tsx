import type { ComponentType } from 'react';
import type { StageName } from '@roshetta/shared/pipeline.js';
import { Image, TextScan, Pill, Swap, Check, Alert } from '@/lib/icons';
import { STAGE_ORDER } from '@roshetta/shared/pipeline.js';

export type StageStatus = 'pending' | 'running' | 'done' | 'failed';
export interface StageState {
  status: StageStatus;
  durationMs?: number;
}

interface StepDef {
  stage: StageName;
  title: string;
  titleAr: string;
  Icon: ComponentType<{ size?: number }>;
}

const STEPS: readonly StepDef[] = [
  { stage: 'preprocessor', title: 'Prepare', titleAr: 'تجهيز', Icon: Image },
  { stage: 'ocr-reader', title: 'Read', titleAr: 'قراءة', Icon: TextScan },
  { stage: 'nlp-parser', title: 'Identify', titleAr: 'تحديد الدواء', Icon: Pill },
  { stage: 'alternatives-finder', title: 'Find alternatives', titleAr: 'البدائل', Icon: Swap },
];

interface PipelineStepperProps {
  stages: Record<StageName, StageState>;
  totalDurationMs?: number;
}

function statusClass(s: StageStatus): string {
  if (s === 'running') return 'is-running';
  if (s === 'done') return 'is-done';
  if (s === 'failed') return 'is-failed';
  return '';
}

function meta(state: StageState): string {
  if (state.status === 'running') return '…';
  if (state.status === 'done' && state.durationMs !== undefined) return `${(state.durationMs / 1000).toFixed(1)}s`;
  if (state.status === 'failed') return 'failed';
  return '';
}

function progressPercent(stages: Record<StageName, StageState>): number {
  const total = STAGE_ORDER.length;
  let done = 0;
  let running = 0;
  for (const s of STAGE_ORDER) {
    if (stages[s].status === 'done') done++;
    else if (stages[s].status === 'running') running++;
  }
  const completed = done + running * 0.5;
  return Math.min(100, (completed / total) * 100);
}

export function PipelineStepper({ stages, totalDurationMs }: PipelineStepperProps) {
  const pct = progressPercent(stages);

  return (
    <section className="section">
      <div className="section__head">
        <h2 className="section__title">
          Reading…
          <span className="section__title-alt" lang="ar" dir="rtl">جاري القراءة…</span>
        </h2>
        {totalDurationMs !== undefined ? (
          <span className="section__hint">
            Done in {(totalDurationMs / 1000).toFixed(1)}s
            <span className="section__hint-alt" lang="ar" dir="rtl">خلصت في {(totalDurationMs / 1000).toFixed(1)} ثانية</span>
          </span>
        ) : null}
      </div>
      <div className="stepper">
        <div className="stepper__line"><div className="stepper__line-fill" style={{ width: `${pct}%` }} /></div>
        <div className="stepper__items">
          {STEPS.map(({ stage, title, titleAr, Icon }) => {
            const state = stages[stage];
            const klass = statusClass(state.status);
            return (
              <div key={stage} className={`step ${klass}`}>
                <span className="step__icon" aria-hidden>
                  {state.status === 'done' ? <Check size={18} />
                   : state.status === 'failed' ? <Alert size={18} />
                   : <Icon size={18} />}
                </span>
                <div>
                  <div className="step__title">{title}</div>
                  <div className="step__title-ar" lang="ar" dir="rtl">{titleAr}</div>
                  <div className="step__meta">{meta(state)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
