declare module 'dotenv' {
  export interface DotenvConfigOptions {
    path?: string | URL;
    encoding?: string;
    debug?: boolean;
    override?: boolean;
    processEnv?: Record<string, string | undefined>;
  }

  export interface DotenvConfigOutput {
    error?: Error;
    parsed?: Record<string, string>;
  }

  export function config(options?: DotenvConfigOptions): DotenvConfigOutput;
}
