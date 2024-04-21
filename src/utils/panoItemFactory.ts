import '@girs/gnome-shell/dist/extensions/global';

import Cogl from '@girs/cogl-14';
import GdkPixbuf from '@girs/gdkpixbuf-2.0';
import Gio from '@girs/gio-2.0';
import GLib from '@girs/glib-2.0';
import type { ExtensionBase } from '@girs/gnome-shell/dist/extensions/sharedInternals';
import { CodePanoItem } from '@pano/components/codePanoItem';
import { ColorPanoItem } from '@pano/components/colorPanoItem';
import { EmojiPanoItem } from '@pano/components/emojiPanoItem';
import { FilePanoItem } from '@pano/components/filePanoItem';
import { ImagePanoItem } from '@pano/components/imagePanoItem';
import { LinkPanoItem } from '@pano/components/linkPanoItem';
import { PanoItem } from '@pano/components/panoItem';
import { TextPanoItem } from '@pano/components/textPanoItem';
import type PanoExtension from '@pano/extension';
import { ClipboardContent, ClipboardManager, ContentType, FileOperation } from '@pano/utils/clipboardManager';
import { ClipboardQueryBuilder, db, DBItem } from '@pano/utils/db';
import { getDocument, getImage } from '@pano/utils/linkParser';
import {
  getCachePath,
  getCurrentExtensionSettings,
  getImagesPath,
  gettext,
  logger,
  playAudio,
} from '@pano/utils/shell';
import { notify } from '@pano/utils/ui';
import convert from 'hex-color-converter';
import isUrl from 'is-url';
import prettyBytes from 'pretty-bytes';
import { validateHTMLColorHex, validateHTMLColorName, validateHTMLColorRgb } from 'validate-color';

const debug = logger('pano-item-factory');

//TODO: make configurable
const MINIMUM_LANGUAGE_RELEVANCE = 0.1;

const isValidUrl = (text: string) => {
  try {
    return isUrl(text) && GLib.uri_parse(text, GLib.UriFlags.NONE) !== null;
  } catch (err) {
    return false;
  }
};

const findOrCreateDbItem = async (ext: PanoExtension, clip: ClipboardContent): Promise<DBItem | null> => {
  const { value, type } = clip.content;
  const queryBuilder = new ClipboardQueryBuilder();
  switch (type) {
    case ContentType.FILE:
      queryBuilder.withItemTypes(['FILE']).withMatchValue(`${value.operation}${value.fileList.sort().join('')}`);
      break;
    case ContentType.IMAGE:
      queryBuilder
        .withItemTypes(['IMAGE'])
        .withMatchValue(GLib.compute_checksum_for_bytes(GLib.ChecksumType.MD5, new GLib.Bytes(value)));
      break;
    case ContentType.TEXT:
      queryBuilder.withItemTypes(['LINK', 'TEXT', 'CODE', 'COLOR', 'EMOJI']).withMatchValue(value).build();
      break;
    default:
      return null;
  }

  const result: DBItem[] = db.query(queryBuilder.build());

  if (getCurrentExtensionSettings(ext).get_boolean('play-audio-on-copy')) {
    playAudio();
  }

  if (result.length > 0) {
    return db.update({
      ...(result[0] as DBItem),
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
      const checksum = GLib.compute_checksum_for_bytes(GLib.ChecksumType.MD5, new GLib.Bytes(value));
      if (!checksum) {
        return null;
      }
      const imageFilePath = `${getImagesPath(ext)}/${checksum}.png`;
      const imageFile = Gio.File.new_for_path(imageFilePath);
      imageFile.replace_contents(value, null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null);
      const [, width, height] = GdkPixbuf.Pixbuf.get_file_info(imageFilePath);
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
      const trimmedValue = value.trim();

      if (trimmedValue.toLowerCase().startsWith('http') && isValidUrl(trimmedValue)) {
        const linkPreviews = getCurrentExtensionSettings(ext).get_boolean('link-previews');
        let description: undefined | string;
        let imageUrl: string | undefined;
        let title: string | undefined;
        let checksum: string | undefined;

        const copyDate = new Date();
        let linkDbItem = db.save({
          content: trimmedValue,
          copyDate,
          isFavorite: false,
          itemType: 'LINK',
          matchValue: trimmedValue,
          searchValue: `${title}${description}${trimmedValue}`,
          metaData: JSON.stringify({
            title: title ? encodeURI(title) : '',
            description: description ? encodeURI(description) : '',
            image: checksum ?? '',
          }),
        });

        if (linkPreviews && linkDbItem) {
          const document = await getDocument(trimmedValue);
          description = document.description;
          title = document.title;
          imageUrl = document.imageUrl;
          checksum = (await getImage(ext, imageUrl))[0] ?? undefined;
          linkDbItem = db.update({
            id: linkDbItem.id,
            content: trimmedValue,
            copyDate: copyDate,
            isFavorite: false,
            itemType: 'LINK',
            matchValue: trimmedValue,
            searchValue: `${title}${description}${trimmedValue}`,
            metaData: JSON.stringify({
              title: title ? encodeURI(title) : '',
              description: description ? encodeURI(description) : '',
              image: checksum ?? '',
            }),
          });
        }

        return linkDbItem;
      }
      if (
        validateHTMLColorHex(trimmedValue) ||
        validateHTMLColorRgb(trimmedValue) ||
        validateHTMLColorName(trimmedValue)
      ) {
        return db.save({
          content: trimmedValue,
          copyDate: new Date(),
          isFavorite: false,
          itemType: 'COLOR',
          matchValue: trimmedValue,
          searchValue: trimmedValue,
        });
      }

      if (/^\p{Extended_Pictographic}*$/u.test(trimmedValue)) {
        return db.save({
          content: trimmedValue,
          copyDate: new Date(),
          isFavorite: false,
          itemType: 'EMOJI',
          matchValue: trimmedValue,
          searchValue: trimmedValue,
        });
      }

      const detectedLanguage = ext.markdownDetector?.detectLanguage(trimmedValue);

      if (detectedLanguage && detectedLanguage.relevance >= MINIMUM_LANGUAGE_RELEVANCE) {
        return db.save({
          content: value,
          copyDate: new Date(),
          isFavorite: false,
          itemType: 'CODE',
          matchValue: value,
          searchValue: value,
          metaData: JSON.stringify({
            language: detectedLanguage.language,
          }),
        });
      }

      return db.save({
        content: value,
        copyDate: new Date(),
        isFavorite: false,
        itemType: 'TEXT',
        matchValue: value,
        searchValue: value,
      });

    default:
      return null;
  }
};

export const createPanoItem = async (
  ext: PanoExtension,
  clipboardManager: ClipboardManager,
  clip: ClipboardContent,
): Promise<PanoItem | null> => {
  let dbItem: DBItem | null = null;

  try {
    dbItem = await findOrCreateDbItem(ext, clip);
  } catch (err) {
    debug(`err: ${err}`);
    return null;
  }

  if (dbItem) {
    if (getCurrentExtensionSettings(ext).get_boolean('send-notification-on-copy')) {
      sendNotification(ext, dbItem);
    }

    return createPanoItemFromDb(ext, clipboardManager, dbItem);
  }

  return null;
};

export const createPanoItemFromDb = (
  ext: PanoExtension,
  clipboardManager: ClipboardManager,
  dbItem: DBItem | null,
): PanoItem | null => {
  if (!dbItem) {
    return null;
  }

  let panoItem: PanoItem;

  switch (dbItem.itemType) {
    case 'TEXT':
      panoItem = new TextPanoItem(ext, clipboardManager, dbItem);
      break;
    case 'CODE': {
      let language: string | undefined;

      if (dbItem.metaData && dbItem.metaData !== '') {
        const metaData: { language: string | undefined } = JSON.parse(dbItem.metaData);
        language = metaData.language;
      }

      if (!language) {
        const detectedLanguage = ext.markdownDetector?.detectLanguage(dbItem.content.trim());
        if (detectedLanguage && detectedLanguage.relevance >= MINIMUM_LANGUAGE_RELEVANCE) {
          language = detectedLanguage.language;
        }
      }

      if (language && ext.markdownDetector) {
        try {
          panoItem = new CodePanoItem(ext, clipboardManager, dbItem, language);
          // this might fail in some really rare cases
        } catch (err) {
          debug(`Couldn't create a code item: ${err}`);
          panoItem = new TextPanoItem(ext, clipboardManager, dbItem);
        }
      } else {
        panoItem = new TextPanoItem(ext, clipboardManager, dbItem);
      }

      break;
    }

    case 'LINK':
      panoItem = new LinkPanoItem(ext, clipboardManager, dbItem);
      break;
    case 'COLOR':
      panoItem = new ColorPanoItem(ext, clipboardManager, dbItem);
      break;
    case 'FILE':
      panoItem = new FilePanoItem(ext, clipboardManager, dbItem);
      break;
    case 'IMAGE':
      panoItem = new ImagePanoItem(ext, clipboardManager, dbItem);
      break;
    case 'EMOJI':
      panoItem = new EmojiPanoItem(ext, clipboardManager, dbItem);
      break;

    default:
      return null;
  }

  panoItem.connect('on-remove', (_, dbItemStr: string) => {
    const dbItem: DBItem = JSON.parse(dbItemStr);
    removeItemResources(ext, dbItem);
  });

  panoItem.connect('on-favorite', (_, dbItemStr: string) => {
    const dbItem: DBItem = JSON.parse(dbItemStr);
    db.update({
      ...dbItem,
      copyDate: new Date(dbItem.copyDate),
    });
  });

  return panoItem;
};

function converter(color: string): string | null {
  try {
    return convert(color);
  } catch (_err) {
    return null;
  }
}

export const removeItemResources = (ext: ExtensionBase, dbItem: DBItem) => {
  db.delete(dbItem.id);
  if (dbItem.itemType === 'LINK') {
    const { image } = JSON.parse(dbItem.metaData || '{}');
    if (image && Gio.File.new_for_uri(`file://${getCachePath(ext)}/${image}.png`).query_exists(null)) {
      Gio.File.new_for_uri(`file://${getCachePath(ext)}/${image}.png`).delete(null);
    }
  } else if (dbItem.itemType === 'IMAGE') {
    const imageFilePath = `file://${getImagesPath(ext)}/${dbItem.content}.png`;
    const imageFile = Gio.File.new_for_uri(imageFilePath);
    if (imageFile.query_exists(null)) {
      imageFile.delete(null);
    }
  }
};

const sendNotification = (ext: ExtensionBase, dbItem: DBItem) => {
  const _ = gettext(ext);
  if (dbItem.itemType === 'IMAGE') {
    const { width, height, size }: { width: number; height: number; size: number } = JSON.parse(
      dbItem.metaData || '{}',
    );
    notify(
      ext,
      _('Image Copied'),
      _('Width: %spx, Height: %spx, Size: %s').format(width, height, prettyBytes(size)),
      GdkPixbuf.Pixbuf.new_from_file(`${getImagesPath(ext)}/${dbItem.content}.png`),
    );
  } else if (dbItem.itemType === 'TEXT') {
    notify(ext, _('Text Copied'), dbItem.content.trim());
  } else if (dbItem.itemType === 'CODE') {
    notify(ext, _('Code Copied'), dbItem.content.trim());
  } else if (dbItem.itemType === 'EMOJI') {
    notify(ext, _('Emoji Copied'), dbItem.content);
  } else if (dbItem.itemType === 'LINK') {
    const { title, description, image }: { title: string; description: string; image: string } = JSON.parse(
      dbItem.metaData || '{}',
    );
    const pixbuf = image ? GdkPixbuf.Pixbuf.new_from_file(`${getCachePath(ext)}/${image}.png`) : undefined;
    notify(
      ext,
      decodeURI(`${_('Link Copied')}${title ? ` - ${title}` : ''}`),
      `${dbItem.content}${description ? `\n\n${decodeURI(description)}` : ''}`,
      pixbuf,
      Cogl.PixelFormat.RGB_888,
    );
  } else if (dbItem.itemType === 'COLOR') {
    // Create pixbuf from color
    const pixbuf = GdkPixbuf.Pixbuf.new(GdkPixbuf.Colorspace.RGB, true, 8, 1, 1);
    let color: string | null = null;
    // check if content has alpha
    if (dbItem.content.includes('rgba')) {
      color = converter(dbItem.content);
    } else if (validateHTMLColorRgb(dbItem.content)) {
      color = `${converter(dbItem.content)}ff`;
    } else if (validateHTMLColorHex(dbItem.content)) {
      color = `${dbItem.content}ff`;
    }

    if (color) {
      pixbuf.fill(parseInt(color.replace('#', '0x'), 16));
      notify(ext, _('Color Copied'), dbItem.content, pixbuf);
    }
  } else if (dbItem.itemType === 'FILE') {
    const operation = dbItem.metaData;
    const fileListSize = JSON.parse(dbItem.content).length;
    notify(
      ext,
      _('File %s').format(operation === FileOperation.CUT ? 'cut' : 'copied'),
      _('There are %s file(s)').format(fileListSize),
    );
  }
};
