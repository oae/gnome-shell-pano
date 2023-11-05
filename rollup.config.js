import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import cleanup from 'rollup-plugin-cleanup';
import copy from 'rollup-plugin-copy';
import styles from 'rollup-plugin-styles';
import visualizer from 'rollup-plugin-visualizer';

const buildPath = 'dist';

const importsGeneral = {
  // this is used to pin point the version to >= and not = , since that may fail, it isn't the best solution, since types might change in later versions, but at, there is not better solution!
  'gi://Shell?version=12': { name: 'gi://Shell?version>=12' }, // TODO:  not typed and officially supported yet, wait for types updates! (12 + 13)
  'gi://Meta?version=12': { name: 'gi://Meta?version>=12' }, // TODO:  not typed and officially supported yet, wait for types updates! (12 + 13)
  'gi://Clutter?version=12': { name: 'gi://Clutter?version>=12' }, // TODO:  not typed and officially supported yet, wait for types updates! (12 + 13)
  'gi://St?version=12': { name: 'gi://St?version>=12' }, // TODO:  not typed and officially supported yet, wait for types updates! (12 + 13)
  'gi://Cogl?version=12': { name: 'gi://Cogl?version>=12' }, // TODO:  not typed and officially supported yet, wait for types updates! (12 + 13)
  'gi://Gda?version=5.0': { name: 'gi://Gda?version>=5.0' }, // We officially support (it's also typed!) both 5.0 and 6.0 

  // extension.js + prefs.js resources
  '@gnome-shell/misc/util': { name: 'resource://EXT_ROOT/misc/util.js' },
  '@gnome-shell/misc/animationUtils': { name: 'resource://EXT_ROOT/misc/animationUtils.js' },
  '@gnome-shell/extensions/extension': { name: 'resource://EXT_ROOT/extensions/extension.js' },
  '@gnome-shell/ui/layout': { name: 'resource://EXT_ROOT/ui/layout.js' },
  '@gnome-shell/ui/main': { name: 'resource://EXT_ROOT/ui/main.js' },
  '@gnome-shell/ui/messageTray': { name: 'resource://EXT_ROOT/ui/messageTray.js' },
  '@gnome-shell/ui/lightbox': { name: 'resource://EXT_ROOT/ui/lightbox.js' },
  '@gnome-shell/ui/dialog': { name: 'resource://EXT_ROOT/ui/dialog.js' },
  '@gnome-shell/ui/modalDialog': { name: 'resource://EXT_ROOT/ui/modalDialog.js' },
  '@gnome-shell/ui/popupMenu': { name: 'resource://EXT_ROOT/ui/popupMenu.js' },
  '@gnome-shell/ui/panelMenu': { name: 'resource://EXT_ROOT/ui/panelMenu.js' },

};

// prefs.js specific resources
const importsPrefs = {
  ...importsGeneral,
  '@gnome-shell/extensions/prefs': { name: 'resource://EXT_ROOT/extensions/prefs.js' },
}

const ExtensionEntries = Object.fromEntries(Object.entries(importsGeneral).map(([name, { name: mapping }]) => {
  return ([name, mapping.replaceAll(/EXT_ROOT/g, "/org/gnome/shell")])
}))



const PreferencesEntries = Object.fromEntries(Object.entries(importsPrefs).map(([name, { name: mapping }]) => {
  return ([name, mapping.replaceAll(/EXT_ROOT/g, "/org/gnome/Shell/Extensions/js")])
}))


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


const GlobalEntries = {}

const thirdPartyBuild = thirdParty.map((pkg) => {
  const sanitizedPkg = pkg.split('/').join('_').replaceAll('-', '_').replaceAll('.', '_').replaceAll('@', '');
  GlobalEntries[pkg] = `./thirdparty/${sanitizedPkg}.js`

  return {
    input: `node_modules/${pkg}`,
    output: {
      file: `${buildPath}/thirdparty/${sanitizedPkg}.js`,
      format: 'esm',
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


const builds = [
  ...thirdPartyBuild,
  {
    input: 'src/extension.ts',
    treeshake: {
      moduleSideEffects: 'no-external',
    },
    output: {
      file: `${buildPath}/extension.js`,
      format: 'esm',
      name: 'init',
      exports: 'default',
      paths: { ...ExtensionEntries, ...GlobalEntries },
      assetFileNames: '[name][extname]'
    },
    external: thirdParty,
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
      format: 'esm',
      exports: 'default',
      name: 'prefs',
      paths: { ...PreferencesEntries, ...GlobalEntries },
    },
    treeshake: {
      moduleSideEffects: 'no-external',
    },
    external: thirdParty,
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

export default builds
