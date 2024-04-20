import { logger } from '@pano/utils/shell';

const debug = logger('pango');

export type Language = {
  relevance: number;
  language: string;
};

export function detectLanguage(_text: string): Language | undefined {
  //TODO: implement language detection
  return undefined;
}

export function markupCode(_language: string, _text: string, _characterLength: number): string {
  //TODO implement code highlighting
  debug('TODO');
  return '';
}
