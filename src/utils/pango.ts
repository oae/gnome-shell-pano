import type { CodeHighlighter, Language } from '@pano/utils/code/highlight';
import { PygmentsCodeHighlighter } from '@pano/utils/code/pygments';

//TODO:
// add highlight.js back, if it is installed and can be found via require()
// add settings, that might change theses things:
// which doe formatter to use, which style to use
// enable, disable formatting, change the threshold (event if its always 1.0 in e.g pygmentize)
// only make these count, if enabled is set, so if at least one formatter is found
// button to recheck tools
// customs settings per highlighter

let detectedHighlighter: CodeHighlighter[] | null = null;

let currentHighlighter: CodeHighlighter | null = null;

const availableCodeHighlighter: CodeHighlighter[] = [new PygmentsCodeHighlighter()];

// this is only implicitly called once, even if nothing is found, it isn't called again later, it has to be initiated by the user later, to scan again
export function detectHighlighter(force = false, preferredHighlighter: string | null = null) {
  if (detectedHighlighter !== null && !force) {
    return;
  }

  detectedHighlighter = [];

  for (const codeHighlighter of availableCodeHighlighter) {
    if (codeHighlighter.isInstalled()) {
      detectedHighlighter.push(codeHighlighter);

      if (preferredHighlighter === null) {
        if (currentHighlighter === null) {
          currentHighlighter = codeHighlighter;
        }
      } else if (codeHighlighter.name == preferredHighlighter) {
        currentHighlighter = codeHighlighter;
      }
    }
  }
}

export function detectLanguage(text: string): Language | undefined {
  if (detectedHighlighter === null) {
    detectHighlighter();
  }

  if (currentHighlighter === null) {
    return undefined;
  }

  return currentHighlighter.detectLanguage(text);
}

export function markupCode(language: string, text: string, characterLength: number): string | undefined {
  if (detectedHighlighter === null) {
    detectHighlighter();
  }

  if (currentHighlighter === null) {
    return undefined;
  }

  return currentHighlighter.markupCode(language, text, characterLength);
}
