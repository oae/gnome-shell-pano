import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import cleanup from 'rollup-plugin-cleanup';
import copy from 'rollup-plugin-copy';
import styles from 'rollup-plugin-styles';
import visualizer from 'rollup-plugin-visualizer';

const buildPath = 'dist';

const importsGeneral = {
  '@gi-types/gdk4': { name: 'gi://Gdk' },
  '@gi-types/gio2': { name: 'gi://Gio' },
  '@gi-types/gtk4': { name: 'gi://Gtk?version=4.0' },
  '@gi-types/gdkpixbuf2': { name: 'gi://GdkPixbuf' },
  '@gi-types/glib2': { name: 'gi://GLib' },
  '@gi-types/st1': { name: 'gi://St' },
  '@gi-types/shell0': { name: 'gi://Shell' },
  '@gi-types/meta10': { name: 'gi://Meta' },
  '@gi-types/clutter10': { name: 'gi://Clutter' },
  '@gi-types/soup3': { name: 'gi://Soup' },
  '@gi-types/gobject2': { name: 'gi://GObject' },
  '@gi-types/pango1': { name: 'gi://Pango' },
  '@gi-types/graphene1': { name: 'gi://Graphene' },
  '@imports/gda6': { name: 'gi://Gda' },
  '@imports/gsound1': { name: 'gi://GSound' },
  '@imports/cogl2': { name: 'gi://Cogl' },
  '@gi-types/adw1': { name: 'gi://Adw' },

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
