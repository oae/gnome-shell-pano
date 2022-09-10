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
import { ChecksumType, compute_checksum_for_bytes, UriFlags, uri_parse } from '@gi-types/glib2';
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
import { getCachePath, getCurrentExtensionSettings, getImagesPath, logger, playAudio } from '@pano/utils/shell';

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

const isValidUrl = (text: string) => {
  try {
    return isUrl(text) && uri_parse(text, UriFlags.NONE) !== null;
  } catch (err) {
    return false;
  }
};

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

  if (getCurrentExtensionSettings().get_boolean('play-audio-on-copy')) {
    playAudio();
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
      if (value.trim().toLowerCase().startsWith('http') && isValidUrl(value)) {
        const offlineMode = getCurrentExtensionSettings().get_boolean('offline-mode');
        let description = '',
          imageUrl = '',
          title = '',
          checksum = null;
        if (!offlineMode) {
          const document = await getDocument(value);
          description = document.description;
          title = document.title;
          imageUrl = document.imageUrl;
          checksum = await getImage(imageUrl)[0];
        }

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

  let panoItem: PanoItem;

  switch (dbItem.itemType) {
    case 'TEXT':
      panoItem = new TextPanoItem(dbItem);
      break;
    case 'CODE':
      panoItem = new CodePanoItem(dbItem);
      break;
    case 'LINK':
      panoItem = new LinkPanoItem(dbItem);
      break;
    case 'COLOR':
      panoItem = new ColorPanoItem(dbItem);
      break;
    case 'FILE':
      panoItem = new FilePanoItem(dbItem);
      break;
    case 'IMAGE':
      panoItem = new ImagePanoItem(dbItem);
      break;

    default:
      return null;
  }

  panoItem.connect('on-remove', (_, dbItemStr: string) => {
    const dbItem: DBItem = JSON.parse(dbItemStr);
    db.delete(dbItem.id);
    if (dbItem.itemType === 'LINK') {
      const { image } = JSON.parse(dbItem.metaData || '{}');
      if (image && File.new_for_uri(`file://${getCachePath()}/${image}.png`).query_exists(null)) {
        File.new_for_uri(`file://${getCachePath()}/${image}.png`).delete(null);
      }
    } else if (dbItem.itemType === 'IMAGE') {
      const imageFilePath = `file://${getImagesPath()}/${dbItem.content}.png`;
      const imageFile = File.new_for_uri(imageFilePath);
      if (imageFile.query_exists(null)) {
        imageFile.delete(null);
      }
    }
  });
  return panoItem;
};
