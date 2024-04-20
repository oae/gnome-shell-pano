import Gio from '@girs/gio-2.0';
import GLib from '@girs/glib-2.0';
import type { ExtensionBase } from '@girs/gnome-shell/dist/extensions/sharedInternals';
import Soup from '@girs/soup-3.0';
import { getCachePath, logger } from '@pano/utils/shell';
import * as htmlparser2 from 'htmlparser2';
const DEFAULT_USER_AGENT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

const session = new Soup.Session();
session.timeout = 5;

const decoder = new TextDecoder();

const debug = logger('link-parser');

type DocumentMetadata = {
  title: string;
  description: string | undefined;
  imageUrl: string | undefined;
};

export const getDocument = async (url: string): Promise<DocumentMetadata> => {
  const defaultResult = {
    title: '',
    description: '',
    imageUrl: '',
  };
  try {
    const message = Soup.Message.new('GET', url);
    message.requestHeaders.append('User-Agent', DEFAULT_USER_AGENT);
    //note: casting required, since this is a gjs convention, to return an promise, instead of accepting a 4. value as callback (thats a C convention, since there's no Promise out of the box, but a callback works)
    const response = (await session.send_and_read_async(
      message,
      GLib.PRIORITY_DEFAULT,
      null,
    )) as any as GLib.Bytes | null;

    if (response == null) {
      debug(`no response from ${url}`);
      return defaultResult;
    }

    const bytes = response.get_data();

    if (bytes == null) {
      debug(`no data from ${url}`);
      return defaultResult;
    }

    const data = decoder.decode(bytes);

    let titleMatch = false;
    let titleTag = '';
    let title: string | undefined;
    let description: string | undefined;
    let imageUrl: string | undefined;
    const p = new htmlparser2.Parser(
      {
        onopentag(name, attribs) {
          if (name === 'meta') {
            if (
              !title &&
              (attribs['property'] === 'og:title' ||
                attribs['property'] === 'twitter:title' ||
                attribs['property'] === 'title' ||
                attribs['name'] === 'og:title' ||
                attribs['name'] === 'twitter:title' ||
                attribs['name'] === 'title')
            ) {
              title = attribs['content'];
            } else if (
              !description &&
              (attribs['property'] === 'og:description' ||
                attribs['property'] === 'twitter:description' ||
                attribs['property'] === 'description' ||
                attribs['name'] === 'og:description' ||
                attribs['name'] === 'twitter:description' ||
                attribs['name'] === 'description')
            ) {
              description = attribs['content'];
            } else if (
              !imageUrl &&
              (attribs['property'] === 'og:image' ||
                attribs['property'] === 'twitter:image' ||
                attribs['property'] === 'image' ||
                attribs['name'] === 'og:image' ||
                attribs['name'] === 'twitter:image' ||
                attribs['name'] === 'image')
            ) {
              imageUrl = attribs['content'];
              if (imageUrl && imageUrl.startsWith('/')) {
                const uri = GLib.uri_parse(url, GLib.UriFlags.NONE);
                imageUrl = `${uri.get_scheme()}://${uri.get_host()}${imageUrl}`;
              }
            }
          }
          if (name === 'title') {
            titleMatch = true;
          }
        },
        ontext(data) {
          if (titleMatch && !title) {
            titleTag += data;
          }
        },
        onclosetag(name) {
          if (name === 'title') {
            titleMatch = false;
          }
        },
      },
      {
        decodeEntities: true,
        lowerCaseTags: true,
        lowerCaseAttributeNames: true,
      },
    );
    p.write(data);
    p.end();

    title = title || titleTag;

    return {
      title,
      description,
      imageUrl,
    };
  } catch (err) {
    debug(`failed to parse link ${url}. err: ${err}`);
  }

  return defaultResult;
};

export const getImage = async (
  ext: ExtensionBase,
  imageUrl: string | undefined,
): Promise<[string | null, Gio.File | null]> => {
  if (imageUrl && imageUrl.startsWith('http')) {
    try {
      const checksum = GLib.compute_checksum_for_string(GLib.ChecksumType.MD5, imageUrl, imageUrl.length);
      const cachedImage = Gio.File.new_for_path(`${getCachePath(ext)}/${checksum}.png`);

      if (cachedImage.query_exists(null)) {
        return [checksum, cachedImage];
      }

      const message = Soup.Message.new('GET', imageUrl);
      message.requestHeaders.append('User-Agent', DEFAULT_USER_AGENT);
      //note: casting required, since this is a gjs convention, to return an promise, instead of accepting a 4. value as callback (thats a C convention, since there's no Promise out of the box, but a callback works)
      const response = (await session.send_and_read_async(
        message,
        GLib.PRIORITY_DEFAULT,
        null,
      )) as any as GLib.Bytes | null;
      if (!response) {
        debug('no response while fetching the image');
        return [null, null];
      }
      const data = response.get_data();
      if (!data || data.length == 0) {
        debug('empty response while fetching the image');
        return [null, null];
      }

      cachedImage.replace_contents(data, null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null);

      return [checksum, cachedImage];
    } catch (err) {
      debug(`failed to load image: ${imageUrl}. err: ${err}`);
    }
  }

  return [null, null];
};
