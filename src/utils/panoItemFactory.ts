import { CodePanoItem } from '@pano/components/codePanoItem';
import { ImagePanoItem } from '@pano/components/imagePanoItem';
import { LinkPanoItem } from '@pano/components/linkPanoItem';
import { PanoItem } from '@pano/components/panoItem';
import { TextPanoItem } from '@pano/components/textPanoItem';
import isUrl from 'is-url';
import hljs from 'highlight.js';
import { ClipboardContent, ContentType } from './clipboardManager';
import { logger } from './shell';

const debug = logger('pano-item-factory');

const SUPPORTED_LANGUAGES = [
  'python',
  'java',
  'javascript',
  'csharp',
  'cpp',
  'c',
  'php',
  'typescript',
  'swift',
  'kotlin',
  'go',
  'rust',
  'ruby',
  'scala',
  'dart',
  'lua',
  'groovy',
  'perl',
  'julia',
  'haskell',
];

export const createPanoItem = (clip: ClipboardContent): PanoItem | null => {
  const { value, type } = clip.content;

  switch (type) {
    case ContentType.FILE:
      break;
    case ContentType.IMAGE:
      return new ImagePanoItem(value, new Date());
    case ContentType.TEXT:
      if (isUrl(value)) {
        return new LinkPanoItem(value, new Date());
      }
      const highlightResult = hljs.highlightAuto(value.slice(0, 1000), SUPPORTED_LANGUAGES);
      debug(`rel: ${highlightResult.relevance} ${highlightResult.language}`);
      if (highlightResult.relevance < 10) {
        return new TextPanoItem(value, new Date());
      } else {
        return new CodePanoItem(value, new Date());
      }

    default:
      break;
  }

  return null;
};
