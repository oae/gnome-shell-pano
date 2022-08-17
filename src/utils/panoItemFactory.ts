import isUrl from 'is-url';

import hljs from 'highlight.js/lib/core';
import python from 'highlight.js/lib/languages/python';
import markdown from 'highlight.js/lib/languages/markdown';
import yaml from 'highlight.js/lib/languages/yaml';
import sql from 'highlight.js/lib/languages/sql';
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
import { getImagesPath, logger } from '@pano/utils/shell';
import { File } from '@imports/gio2';
import { ClipboardQueryBuilder, db, DBItem } from './db';
import { ChecksumType, compute_checksum_for_bytes } from '@imports/glib2';

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
hljs.registerLanguage('sql', sql);

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
  'sql',
  'lua',
  'groovy',
  'perl',
  'julia',
  'haskell',
];

export const createPanoItem = (clip: ClipboardContent, onNewItem: any, onOldItem: any): void => {
  const { value, type } = clip.content;
  let result: DBItem[];
  switch (type) {
    case ContentType.FILE:
      result = db.query(
        new ClipboardQueryBuilder()
          .withItemTypes(['FILE'])
          .withMatchValue(`${value.operation}${value.fileList.sort().join('')}`)
          .build(),
      );

      if (result.length === 0) {
        onNewItem(new FilePanoItem(null, value, new Date()));
      } else {
        onOldItem(result[0].id);
      }
      break;
    case ContentType.IMAGE:
      result = db.query(
        new ClipboardQueryBuilder()
          .withItemTypes(['IMAGE'])
          .withMatchValue(compute_checksum_for_bytes(ChecksumType.MD5, value))
          .build(),
      );

      if (result.length === 0) {
        onNewItem(new ImagePanoItem(null, value, new Date()));
      } else {
        onOldItem(result[0].id);
      }
      break;
    case ContentType.TEXT:
      result = db.query(
        new ClipboardQueryBuilder().withItemTypes(['LINK', 'TEXT', 'CODE']).withMatchValue(value).build(),
      );
      if (result.length === 0) {
        if (value.toLowerCase().startsWith('http') && isUrl(value)) {
          onNewItem(new LinkPanoItem(null, value, new Date()));
          break;
        }
        const highlightResult = hljs.highlightAuto(value.slice(0, 1000), SUPPORTED_LANGUAGES);
        debug(`rel: ${highlightResult.relevance} ${highlightResult.language}`);
        if (highlightResult.relevance < 10) {
          onNewItem(new TextPanoItem(null, value, new Date()));
        } else {
          onNewItem(new CodePanoItem(null, value, new Date()));
        }
      } else {
        onOldItem(result[0].id);
      }
      break;
  }
};

export const createPanoItemFromDb = (dbItem: DBItem): PanoItem | null => {
  switch (dbItem.itemType) {
    case 'TEXT':
      return new TextPanoItem(dbItem.id, dbItem.content, dbItem.copyDate);
    case 'CODE':
      return new CodePanoItem(dbItem.id, dbItem.content, dbItem.copyDate);
    case 'LINK':
      return new LinkPanoItem(dbItem.id, dbItem.content, dbItem.copyDate);
    case 'FILE':
      return new FilePanoItem(
        dbItem.id,
        { fileList: JSON.parse(dbItem.content), operation: dbItem.metaData || 'copy' },
        dbItem.copyDate,
      );
    case 'IMAGE':
      const savedImage = File.new_for_path(`${getImagesPath()}/${dbItem.content}.png`);

      if (!savedImage.query_exists(null)) {
        return null;
      }

      const [bytes] = savedImage.load_bytes(null);

      const data = bytes.get_data();

      if (!data || data.length === 0) {
        return null;
      }
      return new ImagePanoItem(dbItem.id, data, dbItem.copyDate);

    default:
      return null;
  }
};
