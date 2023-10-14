import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import cleanup from 'rollup-plugin-cleanup';
import copy from 'rollup-plugin-copy';
import styles from 'rollup-plugin-styles';
import visualizer from 'rollup-plugin-visualizer';

const buildPath = 'dist';

const globals = {}

const importsGeneral = {
  '@gi-types/gdk4': { name: 'gi://Gdk', type: "*" },
  '@gi-types/gio2': { name: 'gi://Gio', type: "*" },
  '@gi-types/gtk4': { name: 'gi://Gtk?version=4.0', type: "*" },
  '@gi-types/gdkpixbuf2': { name: 'gi://GdkPixbuf', type: "*" },
  '@gi-types/glib2': { name: 'gi://GLib', type: "default" },
  '@gi-types/st1': { name: 'gi://St', type: "*" },
  '@gi-types/shell0': { name: 'gi://Shell', type: "default" },
  '@gi-types/meta10': { name: 'gi://Meta', type: "*" },
  '@gi-types/clutter10': { name: 'gi://Clutter', type: "*" },
  '@gi-types/soup3': { name: 'gi://Soup', type: "default" },
  '@gi-types/gobject2': { name: 'gi://GObject', type: "default" },
  '@gi-types/pango1': { name: 'gi://Pango', type: "*" },
  '@gi-types/graphene1': { name: 'gi://Graphene', type: "*" },
  '@imports/gda6': { name: 'gi://Gda', type: "*" },
  '@imports/gsound1': { name: 'gi://GSound', type: "*" },
  '@imports/cogl2': { name: 'gi://Cogl', type: "*" },
  '@gi-types/adw1': { name: 'gi://Adw', type: "*" },

  // extension.js specific resources
  '@gnome-shell/misc/util': { name: 'resource://EXT_ROOT/misc/util.js', type: "*" },
  '@gnome-shell/extensions/extension': { name: 'resource://EXT_ROOT/extensions/extension.js', type: "*" },
  '@gnome-shell/ui/layout': { name: 'resource://EXT_ROOT/ui/layout.js', type: "*" },
  '@gnome-shell/ui/main': { name: 'resource://EXT_ROOT/ui/main.js', type: "*" },
  '@gnome-shell/ui/messageTray': { name: 'resource://EXT_ROOT/ui/messageTray.js', type: "*" },
  '@gnome-shell/ui/lightbox': { name: 'resource://EXT_ROOT/ui/lightbox.js', type: "*" },
  '@gnome-shell/ui/dialog': { name: 'resource://EXT_ROOT/ui/dialog.js', type: "*" },
  '@gnome-shell/ui/modalDialog': { name: 'resource://EXT_ROOT/ui/modalDialog.js', type: "*" },
  '@gnome-shell/ui/popupMenu': { name: 'resource://EXT_ROOT/ui/popupMenu.js', type: "*" },
  '@gnome-shell/ui/panelMenu': { name: 'resource://EXT_ROOT/ui/panelMenu.js', type: "*" },

};

// prefs.js specific resources
const importsPrefs = {
  ...importsGeneral,
  '@gnome-shell/extensions/prefs': { name: 'resource://EXT_ROOT/extensions/prefs.js', type: "*" },
}

const ExtensionEntries = Object.fromEntries(Object.entries(importsGeneral).map(([name, { name: mapping, type }]) => {
  return ([name, mapping.replaceAll(/EXT_ROOT/g, "/org/gnome/shell")])
}))



const PreferencesEntries = Object.fromEntries(Object.entries(importsPrefs).map(([name, { name: mapping, type }]) => {
  return ([name, mapping.replaceAll(/EXT_ROOT/g, "/org/gnome/Shell/Extensions/js")])
}))


const thirdParty = [
  ['htmlparser2', "*"],
  ['prismjs', "*"],
  ['date-fns/formatDistanceToNow', "*"],
  ['date-fns/locale', "*"],
  ['hex-color-converter', "*"],
  ['is-url', "*"],
  ['pretty-bytes', "*"],
  ['validate-color', "*"],
  ['highlight.js/lib/core', "*"],
  ['highlight.js/lib/languages/bash', "*"],
  ['highlight.js/lib/languages/c', "*"],
  ['highlight.js/lib/languages/cpp', "*"],
  ['highlight.js/lib/languages/csharp', "*"],
  ['highlight.js/lib/languages/dart', "*"],
  ['highlight.js/lib/languages/go', "*"],
  ['highlight.js/lib/languages/groovy', "*"],
  ['highlight.js/lib/languages/haskell', "*"],
  ['highlight.js/lib/languages/java', "*"],
  ['highlight.js/lib/languages/javascript', "*"],
  ['highlight.js/lib/languages/julia', "*"],
  ['highlight.js/lib/languages/kotlin', "*"],
  ['highlight.js/lib/languages/lua', "*"],
  ['highlight.js/lib/languages/markdown', "*"],
  ['highlight.js/lib/languages/perl', "*"],
  ['highlight.js/lib/languages/php', "*"],
  ['highlight.js/lib/languages/python', "*"],
  ['highlight.js/lib/languages/ruby', "*"],
  ['highlight.js/lib/languages/rust', "*"],
  ['highlight.js/lib/languages/scala', "*"],
  ['highlight.js/lib/languages/shell', "*"],
  ['highlight.js/lib/languages/sql', "*"],
  ['highlight.js/lib/languages/swift', "*"],
  ['highlight.js/lib/languages/typescript', "*"],
  ['highlight.js/lib/languages/yaml', "*"]
];

const GlobalEntries = {}

const thirdPartyBuild = thirdParty.map(([pkg, type]) => {
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
