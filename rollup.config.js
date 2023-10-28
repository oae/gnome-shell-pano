import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import cleanup from 'rollup-plugin-cleanup';
import copy from 'rollup-plugin-copy';
import styles from 'rollup-plugin-styles';
import visualizer from 'rollup-plugin-visualizer';

const buildPath = 'dist';

const importsGeneral = {
  '@girs/gdk-4.0': { name: 'gi://Gdk' },
  '@girs/gio-2.0': { name: 'gi://Gio' },
  '@girs/gtk-4.0': { name: 'gi://Gtk?version=4.0' },
  '@girs/gdkpixbuf-2.0': { name: 'gi://GdkPixbuf' },
  '@girs/glib-2.0': { name: 'gi://GLib' },
  '@girs/st-12': { name: 'gi://St?version=1.2' },
  '@girs/shell-12': { name: 'gi://Shell?version=1.2' },
  '@girs/meta-12': { name: 'gi://Meta?version=1.2' },
  '@girs/clutter-12': { name: 'gi://Clutter?version=1.2' },
  '@girs/soup-3.0': { name: 'gi://Soup?version=3.0' },
  '@girs/gobject-2.0': { name: 'gi://GObject' },
  '@girs/pango-1.0': { name: 'gi://Pango' },
  '@girs/graphene-1.0': { name: 'gi://Graphene' },
  '@girs/gda-6.0': { name: 'gi://Gda?version=6.0' },
  '@girs/gsound-1.0': { name: 'gi://GSound' },
  '@girs/cogl-2.0': { name: 'gi://Cogl?version=2.0' },
  '@girs/adw-1': { name: 'gi://Adw' },

  // extension.js specific resources
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
  ['htmlparser2', "*"],
  ['prismjs', "default"],
  ['date-fns/formatDistanceToNow', "normal"],
  ['date-fns/locale', "*"],
  ['hex-color-converter', "*"],
  ['is-url', "*"],
  ['pretty-bytes', "default"],
  ['validate-color', "normal"],
  ['highlight.js/lib/core', "normal"],
  ['highlight.js/lib/languages/bash', "normal"],
  ['highlight.js/lib/languages/c', "normal"],
  ['highlight.js/lib/languages/cpp', "normal"],
  ['highlight.js/lib/languages/csharp', "normal"],
  ['highlight.js/lib/languages/dart', "normal"],
  ['highlight.js/lib/languages/go', "normal"],
  ['highlight.js/lib/languages/groovy', "normal"],
  ['highlight.js/lib/languages/haskell', "normal"],
  ['highlight.js/lib/languages/java', "normal"],
  ['highlight.js/lib/languages/javascript', "normal"],
  ['highlight.js/lib/languages/julia', "normal"],
  ['highlight.js/lib/languages/kotlin', "normal"],
  ['highlight.js/lib/languages/lua', "normal"],
  ['highlight.js/lib/languages/markdown', "normal"],
  ['highlight.js/lib/languages/perl', "normal"],
  ['highlight.js/lib/languages/php', "normal"],
  ['highlight.js/lib/languages/python', "normal"],
  ['highlight.js/lib/languages/ruby', "normal"],
  ['highlight.js/lib/languages/rust', "normal"],
  ['highlight.js/lib/languages/scala', "normal"],
  ['highlight.js/lib/languages/shell', "normal"],
  ['highlight.js/lib/languages/sql', "normal"],
  ['highlight.js/lib/languages/swift', "normal"],
  ['highlight.js/lib/languages/typescript', "normal"],
  ['highlight.js/lib/languages/yaml', "normal"]
];


const GlobalEntries = {}

const thirdPartyBuild = thirdParty.map(([pkg]) => {
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

const external = [...thirdParty.map(([name]) => name)];

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
      format: 'esm',
      exports: 'default',
      name: 'prefs',
      paths: { ...PreferencesEntries, ...GlobalEntries },
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

export default builds
