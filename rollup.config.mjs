import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import cleanup from 'rollup-plugin-cleanup';
import copy from 'rollup-plugin-copy';
import styles from 'rollup-plugin-styles';

const buildPath = 'dist';

const importsGeneral = {
  // CORE Gnome dependencies
  'gi://Gdk?version=4.0': { name: 'gi://Gdk' },
  'gi://Gio?version=2.0': { name: 'gi://Gio' },
  'gi://GdkPixbuf?version=2.0': { name: 'gi://GdkPixbuf' },
  'gi://Graphene?version=1.0': { name: 'gi://Graphene' },
  'gi://Pango?version=1.0': { name: 'gi://Pango' },
  'gi://Soup?version=3.0': { name: 'gi://Soup' },
  'gi://Meta?version=14': { name: 'gi://Meta' },
  'gi://Clutter?version=14': { name: 'gi://Clutter' },
  'gi://Cogl?version=14': { name: 'gi://Cogl' },
  'gi://Shell?version=14': { name: 'gi://Shell' },
  'gi://St?version=14': { name: 'gi://St' },

  // non core dependencies (can have version specifier!)
  'gi://Gda?version=5.0': { name: 'gi://Gda?version>=5.0' }, // We officially support (it's also typed!) both 5.0 and 6.0
  'gi://GSound?version=1.0': { name: 'gi://GSound' },
  'gi://GObject?version=2.0': { name: 'gi://GObject' },
  'gi://GLib?version=2.0': { name: 'gi://GLib' },
  'gi://Gtk?version=4.0': { name: 'gi://Gtk' },
  'gi://Adw?version=1': { name: 'gi://Adw' },

  // extension.js + prefs.js resources
  '@girs/gnome-shell/dist/misc/animationUtils': { name: 'resource://EXT_ROOT/misc/animationUtils.js' },
  '@girs/gnome-shell/dist/extensions/extension': { name: 'resource://EXT_ROOT/extensions/extension.js' },
  '@girs/gnome-shell/dist/ui/layout': { name: 'resource://EXT_ROOT/ui/layout.js' },
  '@girs/gnome-shell/dist/ui/main': { name: 'resource://EXT_ROOT/ui/main.js' },
  '@girs/gnome-shell/dist/ui/messageTray': { name: 'resource://EXT_ROOT/ui/messageTray.js' },
  '@girs/gnome-shell/dist/ui/lightbox': { name: 'resource://EXT_ROOT/ui/lightbox.js' },
  '@girs/gnome-shell/dist/ui/dialog': { name: 'resource://EXT_ROOT/ui/dialog.js' },
  '@girs/gnome-shell/dist/ui/modalDialog': { name: 'resource://EXT_ROOT/ui/modalDialog.js' },
  '@girs/gnome-shell/dist/ui/popupMenu': { name: 'resource://EXT_ROOT/ui/popupMenu.js' },
  '@girs/gnome-shell/dist/ui/panelMenu': { name: 'resource://EXT_ROOT/ui/panelMenu.js' },
  //compatibility imports
  '@girs/gnome-shell-45/dist/ui/messageTray': { name: 'resource://EXT_ROOT/ui/messageTray.js' },
};

// prefs.js specific resources
const importsPrefs = {
  ...importsGeneral,
  '@girs/gnome-shell/dist/extensions/prefs': { name: 'resource://EXT_ROOT/extensions/prefs.js' },
};

const ExtensionEntries = Object.fromEntries(
  Object.entries(importsGeneral).map(([name, { name: mapping }]) => {
    return [name, mapping.replaceAll(/EXT_ROOT/g, '/org/gnome/shell')];
  }),
);

const PreferencesEntries = Object.fromEntries(
  Object.entries(importsPrefs).map(([name, { name: mapping }]) => {
    return [name, mapping.replaceAll(/EXT_ROOT/g, '/org/gnome/Shell/Extensions/js')];
  }),
);

const thirdParty = [
  'htmlparser2',
  'date-fns/formatDistanceToNow',
  'date-fns/locale',
  'hex-color-converter',
  'is-url',
  'pretty-bytes',
  'validate-color',
];

const gnomeShellExternalModules = [/^resource:\/\/\/org\/gnome\/(shell|Shell\/Extensions)\/.*/];

const gjsModules = [...Object.keys(importsGeneral), ...Object.keys(importsPrefs), ...gnomeShellExternalModules];

const globalDefinitionImports = ['@girs/gnome-shell/dist/extensions/global'];

const GlobalEntries = {};

const thirdPartyBuild = thirdParty.map((pkg) => {
  const sanitizedPkg = pkg.split('/').join('_').replaceAll('-', '_').replaceAll('.', '_').replaceAll('@', '');
  GlobalEntries[pkg] = `./thirdparty/${sanitizedPkg}.js`;

  return {
    input: `node_modules/${pkg}`,
    output: {
      file: `${buildPath}/thirdparty/${sanitizedPkg}.js`,
      format: 'esm',
      name: 'lib',
      generatedCode: {
        constBindings: true,
      },
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
      assetFileNames: '[name][extname]',
      generatedCode: {
        constBindings: true,
      },
    },
    external: [...thirdParty, ...gjsModules, ...globalDefinitionImports],
    plugins: [
      commonjs(),
      nodeResolve({
        preferBuiltins: false,
      }),
      typescript({
        tsconfig: './tsconfig.json',
      }),
      styles({
        mode: ['extract', 'stylesheet.css'],
        alias: {
          './images/incognito-mode.svg': '../../resources/images/incognito-mode.svg',
        },
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
      generatedCode: {
        constBindings: true,
      },
    },
    treeshake: {
      moduleSideEffects: 'no-external',
    },
    external: [...thirdParty, ...gjsModules],
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

export default builds;
