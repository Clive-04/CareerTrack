export const MIN_JOB_WORDS = 50;
export const MAX_JOB_CHARACTERS = 20000;
export function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/u).length : 0;
}
