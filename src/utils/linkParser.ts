import { File, FileCreateFlags } from '@imports/gio2';
import { ChecksumType, compute_checksum_for_string, PRIORITY_DEFAULT } from '@imports/glib2';
import { Message, Session } from '@imports/soup3';
import { getCachePath, logger } from '@pano/utils/shell';
import { XMLParser } from 'fast-xml-parser';

const DEFAULT_USER_AGENT = 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)';

const session = new Session();
session.timeout = 5;

const decoder = new TextDecoder();

const debug = logger('link-parser');

const findKey = (obj: any, key: string): any[] => {
  let foundItems: any[] = [];

  if (Array.isArray(obj)) {
    return foundItems;
  }

  Object.entries(obj).forEach(([k, v]) => {
    if (k === key) {
      if (Array.isArray(v)) {
        foundItems = [...foundItems, ...v];
      } else {
        foundItems.push(v);
      }
    } else if (v !== null && typeof v === 'object' && !Array.isArray(v)) {
      foundItems = [...foundItems, ...findKey(v, key)];
    }
  });

  return foundItems;
};

const metaTagContent = (metaList: any[], attrName: string): string => {
  return metaList.find((item) => item?.name == attrName || item?.property == attrName)?.content;
};

export const getMetaList = (doc: any) => findKey(doc, 'meta');

export const getDocument = async (url: string): Promise<any> => {
  try {
    const message = Message.new('GET', url);
    message.request_headers.append('User-Agent', DEFAULT_USER_AGENT);
    const response = await session.send_and_read_async(message, PRIORITY_DEFAULT, null);

    if (response == null) {
      return null;
    }

    const bytes = response.get_data();

    if (bytes == null) {
      return null;
    }

    const data = decoder.decode(bytes);

    const parser = new XMLParser({
      ignoreAttributes: false,
      unpairedTags: ['hr', 'br', 'link', 'meta'],
      stopNodes: ['*.pre', '*.script', '*.html.body'],
      attributeNamePrefix: '',
      processEntities: true,
      htmlEntities: true,
    });
    return parser.parse(data);
  } catch (err) {
    debug(`failed to parse link ${url}`);
  }

  return null;
};

export const getTitle = (doc: any, metaList: any[]): string => {
  const title = findKey(doc, 'title')?.[0];
  let fallbackTitle = '';
  if (title && typeof title === 'object' && '#text' in title) {
    fallbackTitle = title['#text'];
  } else if (typeof title === 'string') {
    fallbackTitle = title;
  }

  return metaTagContent(metaList, 'og:title') || metaTagContent(metaList, 'twitter:title') || fallbackTitle;
};

export const getDescription = (metaList: any[]): string => {
  return metaTagContent(metaList, 'og:description') || metaTagContent(metaList, 'twitter:description');
};

export const getImage = async (metaList: any[]) => {
  const imageUrl = metaTagContent(metaList, 'og:image') || metaTagContent(metaList, 'twitter:image');

  if (imageUrl && imageUrl.startsWith('http')) {
    try {
      const cachedImage = File.new_for_path(
        `${getCachePath()}/${compute_checksum_for_string(ChecksumType.MD5, imageUrl, imageUrl.length)}.png`,
      );

      if (cachedImage.query_exists(null)) {
        return cachedImage;
      }

      const message = Message.new('GET', imageUrl);
      message.request_headers.append('User-Agent', DEFAULT_USER_AGENT);
      const response = await session.send_and_read_async(message, PRIORITY_DEFAULT, null);
      if (!response) {
        throw new Error('no response');
      }
      const data = response.get_data();
      if (!data || data.length == 0) {
        throw new Error('empty response');
      }

      cachedImage.replace_contents(data, null, false, FileCreateFlags.REPLACE_DESTINATION, null);

      return cachedImage;
    } catch (err) {
      debug(`failed to load image: ${imageUrl}. err: ${err}`);
    }
  }

  return null;
};
