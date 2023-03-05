import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import cleanup from 'rollup-plugin-cleanup';
import copy from 'rollup-plugin-copy';
import styles from 'rollup-plugin-styles';
import visualizer from 'rollup-plugin-visualizer';

const buildPath = 'dist';

const globals = {
  '@gi-types/gdk4': 'imports.gi.Gdk',
  '@gi-types/gio2': 'imports.gi.Gio',
  '@gi-types/gtk4': 'imports.gi.Gtk',
  '@gi-types/gdkpixbuf2': 'imports.gi.GdkPixbuf',
  '@gi-types/glib2': 'imports.gi.GLib',
  '@gi-types/st1': 'imports.gi.St',
  '@gi-types/shell0': 'imports.gi.Shell',
  '@gi-types/meta10': 'imports.gi.Meta',
  '@gi-types/clutter10': 'imports.gi.Clutter',
  '@gi-types/soup3': 'imports.gi.Soup',
  '@gi-types/gobject2': 'imports.gi.GObject',
  '@gi-types/pango1': 'imports.gi.Pango',
  '@gi-types/graphene1': 'imports.gi.Graphene',
  '@imports/gda6': 'imports.gi.Gda',
  '@imports/gsound1': 'imports.gi.GSound',
  '@imports/cogl2': 'imports.gi.Cogl',
  '@gi-types/adw1': 'imports.gi.Adw',
};

const thirdParty = [
  'htmlparser2',
  'prismjs',
  'date-fns/formatDistanceToNow',
  'date-fns/locale',
  'hex-color-converter',
  'is-url',
  'pretty-bytes',
  'validate-color',
  'highlight.js/lib/core',
  'highlight.js/lib/languages/bash',
  'highlight.js/lib/languages/c',
  'highlight.js/lib/languages/cpp',
  'highlight.js/lib/languages/csharp',
  'highlight.js/lib/languages/dart',
  'highlight.js/lib/languages/go',
  'highlight.js/lib/languages/groovy',
  'highlight.js/lib/languages/haskell',
  'highlight.js/lib/languages/java',
  'highlight.js/lib/languages/javascript',
  'highlight.js/lib/languages/julia',
  'highlight.js/lib/languages/kotlin',
  'highlight.js/lib/languages/lua',
  'highlight.js/lib/languages/markdown',
  'highlight.js/lib/languages/perl',
  'highlight.js/lib/languages/php',
  'highlight.js/lib/languages/python',
  'highlight.js/lib/languages/ruby',
  'highlight.js/lib/languages/rust',
  'highlight.js/lib/languages/scala',
  'highlight.js/lib/languages/shell',
  'highlight.js/lib/languages/sql',
  'highlight.js/lib/languages/swift',
  'highlight.js/lib/languages/typescript',
  'highlight.js/lib/languages/yaml',
];

const thirdPartyBuild = thirdParty.map((pkg) => {
  const sanitizedPkg = pkg.split('/').join('_').replaceAll('-', '_').replaceAll('.', '_').replaceAll('@', '');
  globals[pkg] = `Me.imports.thirdparty["${sanitizedPkg}"].lib`;

  return {
    input: `node_modules/${pkg}`,
    output: {
      file: `${buildPath}/thirdparty/${sanitizedPkg}.js`,
      format: 'iife',
      name: 'lib',
    },
    treeshake: {
      moduleSideEffects: 'no-external',
    },
    plugins: [
      commonjs(),
      nodeResolve({
        preferBuiltins: false,
      }),
    ],
  };
});

const external = [...Object.keys(globals), thirdParty];

const prefsBanner = [
  "imports.gi.versions.Gtk = '4.0';",
  'const Me = imports.misc.extensionUtils.getCurrentExtension();',
].join('\n');

const prefsFooter = ['var init = prefs.init;', 'var fillPreferencesWindow = prefs.fillPreferencesWindow;'].join('\n');

const extensionBanner = `
const Me = imports.misc.extensionUtils.getCurrentExtension();

try {
`;

const extensionFooter = `
}
catch(err) {
  log(\`[pano] [init] \$\{err\}\`);
  imports.ui.main.notify('Pano', \`\$\{err\}\`);
  throw err;
}
`;

export default [
  ...thirdPartyBuild,
  {
    input: 'src/extension.ts',
    treeshake: {
      moduleSideEffects: 'no-external',
    },
    output: {
      file: `${buildPath}/extension.js`,
      format: 'iife',
      name: 'init',
      banner: extensionBanner,
      footer: extensionFooter,
      exports: 'default',
      globals,
      assetFileNames: '[name][extname]',
    },
    external,
    plugins: [
      commonjs(),
      nodeResolve({
        preferBuiltins: false,
      }),
      typescript({
        tsconfig: './tsconfig.json',
      }),
      styles({
        mode: ['extract', `stylesheet.css`],
      }),
      copy({
        targets: [
          { src: './resources/icons', dest: `${buildPath}` },
          { src: './resources/images', dest: `${buildPath}` },
          { src: './resources/metadata.json', dest: `${buildPath}` },
          { src: './resources/schemas', dest: `${buildPath}` },
          { src: './resources/dbus', dest: `${buildPath}` },
        ],
      }),
      cleanup({
        comments: 'none',
      }),
      visualizer(),
    ],
  },
  {
    input: 'src/prefs/prefs.ts',
    output: {
      file: `${buildPath}/prefs.js`,
      format: 'iife',
      exports: 'default',
      name: 'prefs',
      banner: prefsBanner,
      footer: prefsFooter,
      globals,
    },
    treeshake: {
      moduleSideEffects: 'no-external',
    },
    external,
    plugins: [
      commonjs(),
      nodeResolve({
        preferBuiltins: false,
      }),
      typescript({
        tsconfig: './tsconfig.json',
      }),
      cleanup({
        comments: 'none',
      }),
    ],
  },
];
