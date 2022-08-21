import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import styles from 'rollup-plugin-styles';
import copy from 'rollup-plugin-copy';
import cleanup from 'rollup-plugin-cleanup';
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
  '@imports/gda5': 'imports.gi.Gda',
  '@gi-types/adw1': 'imports.gi.Adw',
};

const external = Object.keys(globals);

const banner = [
  'imports.gi.versions.Gtk = \'4.0\';',
].join('\n');

const prefsFooter = [
  'var init = prefs.init;',
  'var buildPrefsWidget = prefs.buildPrefsWidget;',
].join('\n')

export default [
  {
    input: 'src/extension.ts',
    treeshake: {
      moduleSideEffects: 'no-external'
    },
    output: {
      file: `${buildPath}/extension.js`,
      format: 'iife',
      name: 'init',
      exports: 'default',
      globals,
      assetFileNames: "[name][extname]",
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
        mode: ["extract", `stylesheet.css`],
      }),
      copy({
        targets: [
          { src: './resources/icons', dest: `${buildPath}` },
          { src: './resources/images', dest: `${buildPath}` },
          { src: './resources/metadata.json', dest: `${buildPath}` },
          { src: './resources/schemas', dest: `${buildPath}` },
        ],
      }),
      cleanup({
        comments: 'none'
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
      banner,
      footer: prefsFooter,
      globals,
    },
    treeshake: {
      moduleSideEffects: 'no-external'
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
        comments: 'none'
      }),
    ],
  },
];
