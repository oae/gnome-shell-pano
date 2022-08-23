import isUrl from 'is-url';
import { validateHTMLColorHex, validateHTMLColorName, validateHTMLColorRgb } from 'validate-color/lib/index';

import hljs from 'highlight.js/lib/core';
import c from 'highlight.js/lib/languages/c';
import cpp from 'highlight.js/lib/languages/cpp';
import csharp from 'highlight.js/lib/languages/csharp';
import dart from 'highlight.js/lib/languages/dart';
import go from 'highlight.js/lib/languages/go';
import groovy from 'highlight.js/lib/languages/groovy';
import haskell from 'highlight.js/lib/languages/haskell';
import java from 'highlight.js/lib/languages/java';
import javascript from 'highlight.js/lib/languages/javascript';
import julia from 'highlight.js/lib/languages/julia';
import kotlin from 'highlight.js/lib/languages/kotlin';
import lua from 'highlight.js/lib/languages/lua';
import markdown from 'highlight.js/lib/languages/markdown';
import perl from 'highlight.js/lib/languages/perl';
import php from 'highlight.js/lib/languages/php';
import python from 'highlight.js/lib/languages/python';
import ruby from 'highlight.js/lib/languages/ruby';
import rust from 'highlight.js/lib/languages/rust';
import scala from 'highlight.js/lib/languages/scala';
import sql from 'highlight.js/lib/languages/sql';
import swift from 'highlight.js/lib/languages/swift';
import typescript from 'highlight.js/lib/languages/typescript';
import yaml from 'highlight.js/lib/languages/yaml';

import { Pixbuf } from '@gi-types/gdkpixbuf2';
import { File, FileCreateFlags } from '@gi-types/gio2';
import { ChecksumType, compute_checksum_for_bytes } from '@gi-types/glib2';
import { CodePanoItem } from '@pano/components/codePanoItem';
import { ColorPanoItem } from '@pano/components/colorPanoItem';
import { FilePanoItem } from '@pano/components/filePanoItem';
import { ImagePanoItem } from '@pano/components/imagePanoItem';
import { LinkPanoItem } from '@pano/components/linkPanoItem';
import { PanoItem } from '@pano/components/panoItem';
import { TextPanoItem } from '@pano/components/textPanoItem';
import { ClipboardContent, ContentType } from '@pano/utils/clipboardManager';
import { ClipboardQueryBuilder, db, DBItem } from '@pano/utils/db';
import { getDocument, getImage } from '@pano/utils/linkParser';
import { getImagesPath, logger } from '@pano/utils/shell';

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

const debug = logger('pano-item-factory');

const findOrCreateDbItem = async (clip: ClipboardContent): Promise<DBItem | null> => {
  const { value, type } = clip.content;
  const queryBuilder = new ClipboardQueryBuilder();
  switch (type) {
    case ContentType.FILE:
      queryBuilder.withItemTypes(['FILE']).withMatchValue(`${value.operation}${value.fileList.sort().join('')}`);
      break;
    case ContentType.IMAGE:
      queryBuilder.withItemTypes(['IMAGE']).withMatchValue(compute_checksum_for_bytes(ChecksumType.MD5, value));
      break;
    case ContentType.TEXT:
      queryBuilder.withItemTypes(['LINK', 'TEXT', 'CODE', 'COLOR']).withMatchValue(value).build();
      break;
    default:
      return null;
  }

  const result = db.query(queryBuilder.build());

  if (result.length > 0) {
    return db.update({
      ...result[0],
      copyDate: new Date(),
    });
  }
  switch (type) {
    case ContentType.FILE:
      return db.save({
        content: JSON.stringify(value.fileList),
        copyDate: new Date(),
        isFavorite: false,
        itemType: 'FILE',
        matchValue: `${value.operation}${value.fileList.sort().join('')}`,
        searchValue: `${value.fileList
          .map((f) => {
            const items = f.split('://').filter((c) => !!c);
            return items[items.length - 1];
          })
          .join('')}`,
        metaData: value.operation,
      });
    case ContentType.IMAGE:
      const checksum = compute_checksum_for_bytes(ChecksumType.MD5, value);
      if (!checksum) {
        return null;
      }
      const imageFilePath = `${getImagesPath()}/${checksum}.png`;
      const imageFile = File.new_for_path(imageFilePath);
      imageFile.replace_contents(value, null, false, FileCreateFlags.REPLACE_DESTINATION, null);
      const [, width, height] = Pixbuf.get_file_info(imageFilePath);
      return db.save({
        content: checksum,
        copyDate: new Date(),
        isFavorite: false,
        itemType: 'IMAGE',
        matchValue: checksum,
        metaData: JSON.stringify({
          width,
          height,
          size: value.length,
        }),
      });
    case ContentType.TEXT:
      if (value.trim().toLowerCase().startsWith('http') && isUrl(value)) {
        const { description, imageUrl, title } = await getDocument(value);
        const [checksum] = await getImage(imageUrl);

        return db.save({
          content: value,
          copyDate: new Date(),
          isFavorite: false,
          itemType: 'LINK',
          matchValue: value,
          searchValue: `${title}${description}${value}`,
          metaData: JSON.stringify({
            title: title ? encodeURI(title) : '',
            description: description ? encodeURI(description) : '',
            image: checksum || '',
          }),
        });
        return null;
      }
      if (
        validateHTMLColorHex(value.trim()) ||
        validateHTMLColorRgb(value.trim()) ||
        validateHTMLColorName(value.trim())
      ) {
        return db.save({
          content: value,
          copyDate: new Date(),
          isFavorite: false,
          itemType: 'COLOR',
          matchValue: value,
          searchValue: value,
        });
      }
      const highlightResult = hljs.highlightAuto(value.slice(0, 2000), SUPPORTED_LANGUAGES);
      if (highlightResult.relevance < 10) {
        return db.save({
          content: value,
          copyDate: new Date(),
          isFavorite: false,
          itemType: 'TEXT',
          matchValue: value,
          searchValue: value,
        });
      } else {
        return db.save({
          content: value,
          copyDate: new Date(),
          isFavorite: false,
          itemType: 'CODE',
          matchValue: value,
          searchValue: value,
        });
      }
    default:
      return null;
  }
};

export const createPanoItem = async (clip: ClipboardContent): Promise<PanoItem | null> => {
  let dbItem: DBItem | null = null;

  try {
    dbItem = await findOrCreateDbItem(clip);
  } catch (err) {
    debug(`err: ${err}`);
    return null;
  }

  if (dbItem) {
    return createPanoItemFromDb(dbItem);
  }

  return null;
};

export const createPanoItemFromDb = (dbItem: DBItem | null): PanoItem | null => {
  if (!dbItem) {
    return null;
  }

  switch (dbItem.itemType) {
    case 'TEXT':
      return new TextPanoItem(dbItem);
    case 'CODE':
      return new CodePanoItem(dbItem);
    case 'LINK':
      return new LinkPanoItem(dbItem);
    case 'COLOR':
      return new ColorPanoItem(dbItem);
    case 'FILE':
      return new FilePanoItem(dbItem);
    case 'IMAGE':
      return new ImagePanoItem(dbItem);

    default:
      return null;
  }
};
