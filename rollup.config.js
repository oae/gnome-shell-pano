import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import cleanup from 'rollup-plugin-cleanup';
import copy from 'rollup-plugin-copy';
import styles from 'rollup-plugin-styles';
import visualizer from 'rollup-plugin-visualizer';

const buildPath = 'dist';


const importsGeneral = {
  '@gi-types/gdk4': { name: 'gi://Gdk', type: "*" },
  '@gi-types/gio2': { name: 'gi://Gio', type: "default" },
  '@gi-types/gtk4': { name: 'gi://Gtk?version=4.0', type: "default" },
  '@gi-types/gdkpixbuf2': { name: 'gi://GdkPixbuf', type: "*" },
  '@gi-types/glib2': { name: 'gi://GLib', type: "default" },
  '@gi-types/st1': { name: 'gi://St', type: "default" },
  '@gi-types/shell0': { name: 'gi://Shell', type: "default" },
  '@gi-types/meta10': { name: 'gi://Meta', type: "default" },
  '@gi-types/clutter10': { name: 'gi://Clutter', type: "default" },
  '@gi-types/soup3': { name: 'gi://Soup', type: "default" },
  '@gi-types/gobject2': { name: 'gi://GObject', type: "default" },
  '@gi-types/pango1': { name: 'gi://Pango', type: "default" },
  '@gi-types/graphene1': { name: 'gi://Graphene', type: "default" },
  '@imports/gda6': { name: 'gi://Gda', type: "default" },
  '@imports/gsound1': { name: 'gi://GSound', type: "*" },
  '@imports/cogl2': { name: 'gi://Cogl', type: "*" },
  '@gi-types/adw1': { name: 'gi://Adw', type: "default" },

  // extension.js specific resources
  '@gnome-shell/misc/util': { name: 'resource://EXT_ROOT/misc/util.js', type: "*" },
  '@gnome-shell/misc/animationUtils': { name: 'resource://EXT_ROOT/misc/animationUtils.js', type: "*" },
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

//TODO: respect annotations for the import type:
// *       => import * as name           from
// normal  => import name                from 
// default => import { default as name } from 

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
      commonjs({ requireReturnsDefault: "auto" }),
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
