import { logger } from '@pano/utils/shell';
import PrismJS from 'prismjs';

const debug = logger('pango');

const INVISIBLE_SPACE = '​';

const CLASS_NAMES = [
  { classNames: 'comment', fgcolor: '#636f88' },
  { classNames: 'prolog', fgcolor: '#636f88' },
  { classNames: 'doctype', fgcolor: '#636f88' },
  { classNames: 'cdata', fgcolor: '#636f88' },
  { classNames: 'punctuation', fgcolor: '#81A1C1' },
  { classNames: 'interpolation-punctuation', fgcolor: '#81A1C1' },
  { classNames: 'template-punctuation', fgcolor: '#81A1C1' },
  { classNames: 'property', fgcolor: '#81A1C1' },
  { classNames: 'string-property', fgcolor: '#81A1C1' },
  { classNames: 'parameter', fgcolor: '#81A1C1' },
  { classNames: 'literal-property', fgcolor: '#81A1C1' },
  { classNames: 'tag', fgcolor: '#81A1C1' },
  { classNames: 'constant', fgcolor: '#81A1C1' },
  { classNames: 'symbol', fgcolor: '#81A1C1' },
  { classNames: 'deleted', fgcolor: '#81A1C1' },
  { classNames: 'number', fgcolor: '#B48EAD' },
  { classNames: 'boolean', fgcolor: '#81A1C1' },
  { classNames: 'selector', fgcolor: '#A3BE8C' },
  { classNames: 'attr-name', fgcolor: '#A3BE8C' },
  { classNames: 'string', fgcolor: '#A3BE8C' },
  { classNames: 'template-string', fgcolor: '#A3BE8C' },
  { classNames: 'char', fgcolor: '#A3BE8C' },
  { classNames: 'builtin', fgcolor: '#A3BE8C' },
  { classNames: 'interpolation', fgcolor: '#A3BE8C' },
  { classNames: 'inserted', fgcolor: '#A3BE8C' },
  { classNames: 'operator', fgcolor: '#81A1C1' },
  { classNames: 'entity', fgcolor: '#81A1C1' },
  { classNames: 'url', fgcolor: '#81A1C1' },
  { classNames: 'variable', fgcolor: '#81A1C1' },
  { classNames: 'function-variable', fgcolor: '#81A1C1' },
  { classNames: 'atrule', fgcolor: '#88C0D0' },
  { classNames: 'attr-value', fgcolor: '#88C0D0' },
  { classNames: 'function', fgcolor: '#88C0D0' },
  { classNames: 'class-name', fgcolor: '#88C0D0' },
  { classNames: 'keyword', fgcolor: '#81A1C1' },
  { classNames: 'regex', fgcolor: '#EBCB8B' },
  { classNames: 'regex-delimiter', fgcolor: '#EBCB8B' },
  { classNames: 'regex-source', fgcolor: '#EBCB8B' },
  { classNames: 'regex-flags', fgcolor: '#EBCB8B' },
  { classNames: 'important', fgcolor: '#EBCB8B' },
];

const getColor = (classNames: string): string => {
  const item = CLASS_NAMES.find((n) => classNames === n.classNames);

  if (!item) {
    debug(`class names not found: ${classNames}`);
    return '#fff';
  }

  return item.fgcolor;
};

const stringify = (o, language) => {
  if (typeof o == 'string') {
    return o;
  }
  if (Array.isArray(o)) {
    let s = '';
    o.forEach(function (e) {
      s += stringify(e, language);
    });
    return s;
  }

  const env = {
    type: o.type,
    content: stringify(o.content, language),
    tag: 'span',
    classes: [o.type],
    attributes: {},
    language: language,
  };

  let attributes = '';
  for (const name in env.attributes) {
    attributes += ` ${name}="${(env.attributes[name] || '').replace(/"/g, '&quot;')}"`;
  }

  return `<${env.tag} fgcolor="${getColor(env.classes.join(' '))}" ${attributes}>${env.content}</${env.tag}>`;
};

export const markupCode = (text: string, charLength: number): string => {
  const result =
    INVISIBLE_SPACE +
    stringify(
      PrismJS.util.encode(PrismJS.tokenize(text.slice(0, charLength), PrismJS.languages.javascript)),
      'javascript',
    );

  return result;
};
