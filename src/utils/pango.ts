import { logger } from '@pano/utils/shell';

const debug = logger('pango');

export type Language = {
  relevance: number;
  language: string;
};

export function detectLanguage(text: string): Language | undefined {
  //TODO: implement language detection
  debug('TODO');
  return undefined;
}

export function markupCode(language: string, text: string): string {
  //TODO implement code highlighting
  debug('TODO');
  return '';
}
