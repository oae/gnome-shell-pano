import * as fillPotPo from 'fill-pot-po';
import * as fs from 'fs';
import { GettextExtractor, JsExtractors } from 'gettext-extractor';
import * as gettextParser from 'gettext-parser';
import * as glob from 'glob';
import * as path from 'path';

const extractStrings = (dryRun: boolean) => {
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

  if (!dryRun) {
    extractor.printStats();
  }
};

const mergeStrings = (dryRun: boolean) => {
  return fillPotPo.sync({
    potSources: [`${path.resolve(__dirname)}/../resources/po/*.pot`],
    poSources: [`${path.resolve(__dirname)}/../resources/po/*.po`],
    writeFiles: !dryRun,
    destDir: `${path.resolve(__dirname)}/../resources/po/`,
    logResults: !dryRun,
    wrapLength: 1000,
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

function main() {
  let dryRun = false;

  const lastArg = process.argv.at(-1);

  if (lastArg && ['--dry-run', '--dryRun', '-d'].includes(lastArg)) {
    dryRun = true;
  }

  extractStrings(dryRun);
  const result = mergeStrings(dryRun);

  if (dryRun) {
    let errors = 0;
    for (const vinyl of result) {
      const file = `${path.resolve(__dirname)}/../resources/po/${vinyl.path}`;

      if (!fs.existsSync(file)) {
        console.error(`FATAL ERROR: File ${file} doesn't exist, but was reported as existing, this is a bug!`);
        process.exit(1);
      }

      const actualContent = fs.readFileSync(file);
      if (!actualContent.equals(vinyl.contents)) {
        console.error(`File ${file} isn't valid, please update it!`);
        errors++;
      }
    }
    if (errors > 0) {
      process.exit(1);
    } else {
      console.log('Checked every locales files: No updates necessary');
    }
  }

  if (!dryRun) {
    compileStrings();
  }
}

main();
