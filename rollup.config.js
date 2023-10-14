import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import cleanup from 'rollup-plugin-cleanup';
import copy from 'rollup-plugin-copy';
import styles from 'rollup-plugin-styles';
import visualizer from 'rollup-plugin-visualizer';

const buildPath = 'dist';




const globals = {
  '@gi-types/gdk4': '"gi://Gdk"',
  '@gi-types/gio2': '"gi://Gio"',
  '@gi-types/gtk4': '"gi://Gtk?version=4.0"',
  '@gi-types/gdkpixbuf2': '"gi://GdkPixbuf"',
  '@gi-types/glib2': '"gi://GLib"',
  '@gi-types/st1': '"gi://St"',
  '@gi-types/shell0': '"gi://Shell"',
  '@gi-types/meta10': '"gi://Meta"',
  '@gi-types/clutter10': '"gi://Clutter"',
  '@gi-types/soup3': '"gi://Soup"',
  '@gi-types/gobject2': '"gi://GObject"',
  '@gi-types/pango1': '"gi://Pango"',
  '@gi-types/graphene1': '"gi://Graphene"',
  '@imports/gda6': '"gi://Gda"',
  '@imports/gsound1': '"gi://GSound"',
  '@imports/cogl2': '"gi://Cogl"',
  '@gi-types/adw1': '"gi://Adw"',
  // extension.js specific resources
  '@gnome-shell/misc/util': '"resource:///org/gnome/shell/misc/util.js"',
  '@gnome-shell/extensions/extension': '"resource:///org/gnome/shell/extensions/extension.js"',
  '@gnome-shell/ui/layout': '"resource:///org/gnome/shell/ui/layout.js"',
  '@gnome-shell/ui/main': '"resource:///org/gnome/shell/ui/main.js"',
  '@gnome-shell/ui/messageTray': '"resource:///org/gnome/shell/ui/messageTray.js"',
  '@gnome-shell/ui/lightbox': '"resource:///org/gnome/shell/ui/lightbox.js"',
  '@gnome-shell/ui/dialog': '"resource:///org/gnome/shell/ui/dialog.js"',
  '@gnome-shell/ui/modalDialog': '"resource:///org/gnome/shell/ui/modalDialog.js"',
  '@gnome-shell/ui/popupMenu': '"resource:///org/gnome/shell/ui/popupMenu.js"',
  '@gnome-shell/ui/panelMenu': '"resource:///org/gnome/shell/ui/panelMenu.js"',
  // prefs.js specific resources
  '@gnome-shell/extensions/prefs': '"resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js"'

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
  globals[pkg] = `'./thirdparty/${sanitizedPkg}.js'`;
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

const prefsBanner = ""

const prefsFooter = ['var init = prefs.init;', 'var fillPreferencesWindow = prefs.fillPreferencesWindow;'].join('\n');

const extensionBanner = `
import * as main from 'resource:///org/gnome/shell/ui/main.js';

try {
`;

const extensionFooter = `
}
catch(err) {
  log(\`[pano] [init] \$\{err\}\`);
  main.notify('Pano', \`\$\{err\}\`);
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
