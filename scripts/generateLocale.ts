import * as fillPotPo from 'fill-pot-po';
import { GettextExtractor, JsExtractors } from 'gettext-extractor';
import * as gettextParser from 'gettext-parser';
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';

const extractStrings = () => {
  const extractor = new GettextExtractor();

  extractor
    .createJsParser([
      JsExtractors.callExpression('_', {
        arguments: {
          text: 0,
          context: 1,
        },
      }),
      JsExtractors.callExpression('ngettext', {
        arguments: {
          text: 1,
          textPlural: 2,
          context: 3,
        },
      }),
    ])
    .parseFilesGlob('./src/**/*.@(ts|js|tsx|jsx)');

  extractor.savePotFile(`${path.resolve(__dirname)}/../resources/po/pano@elhan.io.pot`);

  extractor.printStats();
};

const mergeStrings = () => {
  fillPotPo.sync({
    potSources: [`${path.resolve(__dirname)}/../resources/po/*.pot`],
    poSources: [`${path.resolve(__dirname)}/../resources/po/*.po`],
    writeFiles: true,
    destDir: `${path.resolve(__dirname)}/../resources/po/`,
    logResults: true,
  });
};

const compileStrings = () => {
  const poFiles = glob.sync(`${path.resolve(__dirname)}/../resources/po/*.po`);
  poFiles.forEach((po) => {
    const locale = path.parse(po).name;
    const input = fs.readFileSync(po);
    const mo = gettextParser.mo.compile(gettextParser.po.parse(input));
    fs.mkdirSync(`${path.resolve(__dirname)}/../dist/locale/${locale}/LC_MESSAGES`, { recursive: true });
    fs.writeFileSync(`${path.resolve(__dirname)}/../dist/locale/${locale}/LC_MESSAGES/pano@elhan.io.mo`, mo);
  });
};

extractStrings();
mergeStrings();
compileStrings();
