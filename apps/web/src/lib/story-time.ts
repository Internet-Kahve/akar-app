/** Device speech has no reported length: a sentence is timed from its letters at the pace of a Turkish voice. */
const LETTERS_PER_SECOND = 14;

export const sentenceSeconds = (text: string) =>
  Math.max(2, text.length / LETTERS_PER_SECOND);

export const storySeconds = (stories: Array<{ text: string }>) =>
  stories.reduce((sum, s) => sum + sentenceSeconds(s.text), 0);

/** `m:ss`. */
export function clock(seconds: number) {
  const whole = Math.round(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")}`;
}
