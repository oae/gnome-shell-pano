import isUrl from 'is-url';

import hljs from 'highlight.js/lib/core';
import python from 'highlight.js/lib/languages/python';
import markdown from 'highlight.js/lib/languages/markdown';
import yaml from 'highlight.js/lib/languages/yaml';
import java from 'highlight.js/lib/languages/java';
import javascript from 'highlight.js/lib/languages/javascript';
import csharp from 'highlight.js/lib/languages/csharp';
import cpp from 'highlight.js/lib/languages/cpp';
import c from 'highlight.js/lib/languages/c';
import php from 'highlight.js/lib/languages/php';
import typescript from 'highlight.js/lib/languages/typescript';
import swift from 'highlight.js/lib/languages/swift';
import kotlin from 'highlight.js/lib/languages/kotlin';
import go from 'highlight.js/lib/languages/go';
import rust from 'highlight.js/lib/languages/rust';
import ruby from 'highlight.js/lib/languages/ruby';
import scala from 'highlight.js/lib/languages/scala';
import dart from 'highlight.js/lib/languages/dart';
import lua from 'highlight.js/lib/languages/lua';
import groovy from 'highlight.js/lib/languages/groovy';
import perl from 'highlight.js/lib/languages/perl';
import julia from 'highlight.js/lib/languages/julia';
import haskell from 'highlight.js/lib/languages/haskell';

import { CodePanoItem } from '@pano/components/codePanoItem';
import { ImagePanoItem } from '@pano/components/imagePanoItem';
import { LinkPanoItem } from '@pano/components/linkPanoItem';
import { PanoItem } from '@pano/components/panoItem';
import { TextPanoItem } from '@pano/components/textPanoItem';
import { FilePanoItem } from '@pano/components/filePanoItem';
import { ClipboardContent, ContentType } from '@pano/utils/clipboardManager';
import { logger } from '@pano/utils/shell';

hljs.registerLanguage('python', python);
hljs.registerLanguage('markdown', markdown);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('java', java);
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('csharp', csharp);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('c', c);
hljs.registerLanguage('php', php);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('swift', swift);
hljs.registerLanguage('kotlin', kotlin);
hljs.registerLanguage('go', go);
hljs.registerLanguage('rust', rust);
hljs.registerLanguage('ruby', ruby);
hljs.registerLanguage('scala', scala);
hljs.registerLanguage('dart', dart);
hljs.registerLanguage('lua', lua);
hljs.registerLanguage('groovy', groovy);
hljs.registerLanguage('perl', perl);
hljs.registerLanguage('julia', julia);
hljs.registerLanguage('haskell', haskell);

const debug = logger('pano-item-factory');

const SUPPORTED_LANGUAGES = [
  'python',
  'markdown',
  'yaml',
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
      return new FilePanoItem(value, new Date());
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
      return null;
  }
};
