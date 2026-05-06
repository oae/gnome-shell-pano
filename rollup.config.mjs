import commonjs from '@rollup/plugin-commonjs';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import typescript from '@rollup/plugin-typescript';
import cleanup from 'rollup-plugin-cleanup';
import copy from 'rollup-plugin-copy';
import styles from 'rollup-plugin-styler';

const buildPath = 'dist';

const importsGeneral = {
  // CORE Gnome dependencies
  'gi://Gio?version=2.0': { name: 'gi://Gio' },
  'gi://GdkPixbuf?version=2.0': { name: 'gi://GdkPixbuf' },
  'gi://Graphene?version=1.0': { name: 'gi://Graphene' },
  'gi://Pango?version=1.0': { name: 'gi://Pango' },
  'gi://Soup?version=3.0': { name: 'gi://Soup' },
  'gi://St?version=17': { name: 'gi://St' },

  // non core dependencies (can have version specifier!)
  'gi://Gda?version=5.0': { name: 'gi://Gda?version>=5.0' }, // We officially support (it's also typed!) both 5.0 and 6.0
  'gi://GSound?version=1.0': { name: 'gi://GSound' },
  'gi://GObject?version=2.0': { name: 'gi://GObject' },
  'gi://GLib?version=2.0': { name: 'gi://GLib' },

  // extension.js + prefs.js resources
  '@girs/gnome-shell/dist/misc/animationUtils': { name: 'resource://EXT_ROOT/misc/animationUtils.js' },
  '@girs/gnome-shell/dist/ui/layout': { name: 'resource://EXT_ROOT/ui/layout.js' },
  '@girs/gnome-shell/dist/ui/main': { name: 'resource://EXT_ROOT/ui/main.js' },
  '@girs/gnome-shell/dist/ui/messageTray': { name: 'resource://EXT_ROOT/ui/messageTray.js' },
  '@girs/gnome-shell/dist/ui/lightbox': { name: 'resource://EXT_ROOT/ui/lightbox.js' },
  '@girs/gnome-shell/dist/ui/dialog': { name: 'resource://EXT_ROOT/ui/dialog.js' },
  '@girs/gnome-shell/dist/ui/modalDialog': { name: 'resource://EXT_ROOT/ui/modalDialog.js' },
  '@girs/gnome-shell/dist/ui/popupMenu': { name: 'resource://EXT_ROOT/ui/popupMenu.js' },
  '@girs/gnome-shell/dist/ui/panelMenu': { name: 'resource://EXT_ROOT/ui/panelMenu.js' },
  '@girs/gnome-shell/dist/misc/config': { name: 'resource://EXT_ROOT/misc/config.js' },
};

//  extension.js specific resources
const importsExtension = {
  ...importsGeneral,

  // only allowed in extension.js
  'gi://Meta?version=17': { name: 'gi://Meta' },
  'gi://Clutter?version=17': { name: 'gi://Clutter' },
  'gi://Cogl?version=17': { name: 'gi://Cogl' },
  'gi://Shell?version=17': { name: 'gi://Shell' },

  // special extension resources
  '@girs/gnome-shell/dist/extensions/extension': { name: 'resource://EXT_ROOT/extensions/extension.js' },
};

// prefs.js specific resources
const importsPrefs = {
  ...importsGeneral,
  // only allowed in prefs.js
  'gi://Gdk?version=4.0': { name: 'gi://Gdk' },
  'gi://Gtk?version=4.0': { name: 'gi://Gtk' },
  'gi://Adw?version=1': { name: 'gi://Adw' },

  // special preference resources
  '@girs/gnome-shell/dist/extensions/prefs': { name: 'resource://EXT_ROOT/extensions/prefs.js' },
  '@custom_types/gnome-shell/dist/extensions/prefs': { name: 'resource://EXT_ROOT/extensions/prefs.js' },
};

const extensionEntries = Object.fromEntries(
  Object.entries(importsExtension).map(([name, { name: mapping }]) => {
    return [name, mapping.replaceAll(/EXT_ROOT/g, '/org/gnome/shell')];
  }),
);

const preferencesEntries = Object.fromEntries(
  Object.entries(importsPrefs).map(([name, { name: mapping }]) => {
    return [name, mapping.replaceAll(/EXT_ROOT/g, '/org/gnome/Shell/Extensions/js')];
  }),
);

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

const gnomeShellExternalModules = [/^resource:\/\/\/org\/gnome\/(shell|Shell\/Extensions)\/.*/];

const extensionModules = [
  ...Object.keys(importsGeneral),
  ...Object.keys(importsExtension),
  ...gnomeShellExternalModules,
];

const preferenceModules = [...Object.keys(importsGeneral), ...Object.keys(importsPrefs)];

const testModules = [...Object.keys(importsGeneral), ...Object.keys(importsPrefs)];

const globalDefinitionImports = ['@girs/gnome-shell/dist/extensions/global'];

const globalEntries = {};

// Named exports for packages that need explicit configuration
const namedExportsConfig = {
  'validate-color': [
    'validateHTMLColorName',
    'validateHTMLColorSpecialName',
    'validateHTMLColorHex',
    'validateHTMLColorRgb',
    'validateHTMLColorHsl',
    'validateHTMLColorHwb',
    'validateHTMLColorLab',
    'validateHTMLColorLch',
    'validateHTMLColor',
  ],
};

const thirdPartyBuild = thirdParty.map((pkg) => {
  const sanitizedPkg = pkg.split('/').join('_').replaceAll('-', '_').replaceAll('.', '_').replaceAll('@', '');
  globalEntries[pkg] = `./thirdparty/${sanitizedPkg}.js`;

  // Check if this package needs explicit named exports
  const namedExports = namedExportsConfig[pkg];

  return {
    input: `node_modules/${pkg}`,
    output: {
      file: `${buildPath}/thirdparty/${sanitizedPkg}.js`,
      format: 'esm',
      name: 'lib',
      generatedCode: {
        constBindings: true,
      },
      // Re-export named exports if configured
      ...(namedExports && {
        exports: 'named',
      }),
    },
    treeshake: {
      moduleSideEffects: 'no-external',
    },
    plugins: [
      commonjs({
        requireReturnsDefault: 'auto',
        defaultIsModuleExports: namedExports ? false : true,
      }),
      nodeResolve({
        preferBuiltins: false,
      }),
      // Add a custom plugin to re-export named exports for webpack bundles
      ...(namedExports
        ? [
            {
              name: 'export-named',
              renderChunk(code) {
                const exportStatements = namedExports
                  .map((name) => `export const ${name} = libExports.${name};`)
                  .join('\n');
                // Match the export pattern - rollup may use different variable names
                return code.replace(
                  /export \{ (\w+) as default \};/,
                  `export { $1 as default };\n${exportStatements}`,
                );
              },
            },
          ]
        : []),
    ],
  };
});

const testFiles = ['db.test'];

const testBuilds = testFiles.map((file) => {
  return {
    input: `tests/${file}.ts`,
    treeshake: {
      moduleSideEffects: 'no-external',
    },
    output: {
      file: `build/tests/${file}.js`,
      format: 'esm',
      name: 'init',
      paths: { ...extensionEntries, ...globalEntries },
      assetFileNames: '[name][extname]',
      generatedCode: {
        constBindings: true,
      },
    },
    external: [...testModules, ...globalDefinitionImports],
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
      paths: { ...extensionEntries, ...globalEntries },
      assetFileNames: '[name][extname]',
      generatedCode: {
        constBindings: true,
      },
    },
    external: [...thirdParty, ...extensionModules, ...globalDefinitionImports],
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
      paths: { ...preferencesEntries, ...globalEntries },
      generatedCode: {
        constBindings: true,
      },
    },
    treeshake: {
      moduleSideEffects: 'no-external',
    },
    external: [...thirdParty, ...preferenceModules],
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
  ...testBuilds,
];

export default builds;
