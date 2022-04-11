import { File } from '@imports/gio2';
import { PRIORITY_DEFAULT } from '@imports/glib2';
import { Message, Session } from '@imports/soup3';
import { XMLParser } from 'fast-xml-parser';
import { logger } from './shell';

const DEFAULT_USER_AGENT =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.75 Safari/537.36';
const session = new Session();
session.timeout = 2;

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
    message.request_headers.append('user-Agent', DEFAULT_USER_AGENT);
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
  return (
    metaTagContent(metaList, 'og:title') || metaTagContent(metaList, 'twitter:title') || findKey(doc, 'title')?.[0]
  );
};

export const getDescription = (metaList: any[]): string => {
  return metaTagContent(metaList, 'og:description') || metaTagContent(metaList, 'twitter:description');
};

export const getImage = async (metaList: any[]) => {
  const imageUrl = metaTagContent(metaList, 'og:image') || metaTagContent(metaList, 'twitter:image');

  if (imageUrl && imageUrl.startsWith('http')) {
    try {
      const message = Message.new('GET', imageUrl);
      message.request_headers.append('user-agent', DEFAULT_USER_AGENT);
      const response = await session.send_and_read_async(message, PRIORITY_DEFAULT, null);
      if (!response) {
        throw new Error('no response');
      }
      const data = response.get_data();
      if (!data || data.length == 0) {
        throw new Error('empty response');
      }
      const [file, ioStream] = File.new_tmp('XXXXXX.png');
      ioStream.output_stream.write_bytes(data, null);
      ioStream.close(null);

      return file;
    } catch (err) {
      debug(`failed to load image: ${imageUrl}. err: ${err}`);
    }
  }

  return null;
};
