import typescript from '@rollup/plugin-typescript';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import styles from 'rollup-plugin-styles';
import copy from 'rollup-plugin-copy';
import cleanup from 'rollup-plugin-cleanup';

const buildPath = 'dist';

const globals = {
  '@imports/gio2': 'imports.gi.Gio',
  '@imports/gdk4': 'imports.gi.Gdk',
  '@imports/gtk4': 'imports.gi.Gtk',
  '@imports/gdkpixbuf2': 'imports.gi.GdkPixbuf',
  '@imports/glib2': 'imports.gi.GLib',
  '@imports/st1': 'imports.gi.St',
  '@imports/shell0': 'imports.gi.Shell',
  '@imports/meta10': 'imports.gi.Meta',
  '@imports/clutter10': 'imports.gi.Clutter',
  '@imports/soup2': 'imports.gi.Soup',
  '@imports/gobject2': 'imports.gi.GObject',
  '@imports/pango1': 'imports.gi.Pango',
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
          { src: './resources/metadata.json', dest: `${buildPath}` },
          { src: './resources/schemas', dest: `${buildPath}` },
          { src: './resources/dbus', dest: `${buildPath}` },
        ],
      }),
      cleanup({
        comments: 'none'
      }),
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
