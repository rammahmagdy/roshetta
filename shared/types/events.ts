import type { DecodedPrescription } from './prescription.js';
import type { StageName } from './pipeline.js';

export interface StageStartEvent {
  type: 'stage_start';
  stage: StageName;
  at: number;
}

export interface StageCompleteEvent {
  type: 'stage_complete';
  stage: StageName;
  at: number;
  durationMs: number;
}

export interface PipelineCompleteEvent {
  type: 'pipeline_complete';
  result: DecodedPrescription;
  totalDurationMs: number;
}

export interface PipelineErrorEvent {
  type: 'pipeline_error';
  stage: StageName | null;
  message: string;
}

export type PipelineEvent =
  | StageStartEvent
  | StageCompleteEvent
  | PipelineCompleteEvent
  | PipelineErrorEvent;
