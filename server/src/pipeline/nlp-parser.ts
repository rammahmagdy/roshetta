// Thin re-export so the rest of the pipeline keeps importing from the same
// path. The actual implementation lives in ./nlp/ (split into brands,
// dosing, line-parser, index).
export { runNlpParser } from './nlp/index.js';
