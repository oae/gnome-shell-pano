import Clutter from '@girs/clutter-51';
import Cogl from '@girs/cogl-51';
import GLib from '@girs/glib-2.0';
import Meta from '@girs/meta-51';
import Shell from '@girs/shell-51';
import St from '@girs/st-51';

const global = Shell.Global.get();

// compatibility check functions for gnome-shell 48

function stOrientationIsSupported(): boolean {
  return St.BoxLayout.prototype.get_orientation !== undefined;
}

function stSetBytesNeedsContext(): boolean {
  return St.ImageContent.prototype.set_bytes.length === 6;
}

function metaSupportsUnredirectForDisplay() {
  return (
    (Meta as any as { enable_unredirect_for_display?: undefined | (() => void) }).enable_unredirect_for_display !==
    undefined
  );
}

// compatibility check functions for gnome-shell 50

// GNOME < 50 version used to have this function, but instead of importing all types for that, just type that one manually
interface LegacyMetaDisplay {
  set_cursor(cursor: Clutter.CursorType): void;
}

// GNOME < 50 sets the cursor of the whole display with Meta.Display.set_cursor() and the Meta.Cursor enum, since GNOME 50
// every actor has its own cursor (Clutter.Actor.set_cursor_type() and the Clutter.CursorType enum).
// Meta.Cursor still exists, but it is an unrelated class now, so it can't be used to detect the old API.
function metaDisplaySupportsSetCursor(): boolean {
  return (global.display as unknown as Partial<LegacyMetaDisplay>).set_cursor !== undefined;
}

// compatibility check functions for gnome-shell 51

// GNOME < 51 version used to have this function, but instead of importing all types for that, just type that one manually
interface LegacyClutter {
  get_default_backend(): Clutter.Backend;
}

function clutterHasDefaultBackend(): boolean {
  return (Clutter as unknown as Partial<LegacyClutter>).get_default_backend !== undefined;
}

// actual compatibility functions

interface LegacyMetaCursor {
  DEFAULT: Clutter.CursorType;
  POINTER?: Clutter.CursorType;
  // Meta.Cursor.POINTING_HAND was renamed to Meta.Cursor.POINTER in GNOME 48 (Meta 16)
  POINTING_HAND?: Clutter.CursorType;
}

const legacyMetaCursor = (): LegacyMetaCursor => (Meta as unknown as { Cursor: LegacyMetaCursor }).Cursor;

export const MetaCursorPointer: Clutter.CursorType = metaDisplaySupportsSetCursor()
  ? (legacyMetaCursor().POINTING_HAND ?? legacyMetaCursor().POINTER!)
  : Clutter.CursorType.POINTER;

// with per actor cursors, resetting the cursor means inheriting the one of the parent again
export const MetaCursorDefault: Clutter.CursorType = metaDisplaySupportsSetCursor()
  ? legacyMetaCursor().DEFAULT
  : Clutter.CursorType.INHERIT;

export function setCursorType(actor: Clutter.Actor, cursorType: Clutter.CursorType): void {
  if (metaDisplaySupportsSetCursor()) {
    (global.display as unknown as LegacyMetaDisplay).set_cursor(cursorType);
    return;
  }

  actor.set_cursor_type(cursorType);
}

export function getClutterBackendCompat(): Clutter.Backend {
  if (clutterHasDefaultBackend()) {
    return (Clutter as unknown as LegacyClutter).get_default_backend();
  }

  return global.stage.context.get_backend();
}

export type OrientationReturnType = { vertical: boolean } | { orientation: Clutter.Orientation };

export function orientationCompatibility(vertical: boolean): OrientationReturnType {
  if (stOrientationIsSupported()) {
    return { orientation: vertical ? Clutter.Orientation.VERTICAL : Clutter.Orientation.HORIZONTAL };
  }

  return { vertical: vertical };
}

// GNOME < 48 version used to have this function, but instead of importing all types for that, just type that one manually
interface OldMetaObject {
  enable_unredirect_for_display(display: Meta.Display): void;
  disable_unredirect_for_display(display: Meta.Display): void;
}

export function setUnredirectForDisplay(enable: boolean): void {
  if (metaSupportsUnredirectForDisplay()) {
    if (enable) {
      (Meta as any as OldMetaObject).enable_unredirect_for_display(global.display);
    } else {
      (Meta as any as OldMetaObject).disable_unredirect_for_display(global.display);
    }
    return;
  }

  if (enable) {
    global.compositor.enable_unredirect();
  } else {
    global.compositor.disable_unredirect();
  }
}

interface OldImageContent {
  set_bytes(
    data: GLib.Bytes | Uint8Array,
    pixel_format: Cogl.PixelFormat | null,
    width: number,
    height: number,
    row_stride: number,
  ): boolean;
}

export function setBytesCompat(
  content: St.ImageContent,
  data: GLib.Bytes | Uint8Array,
  pixel_format: Cogl.PixelFormat,
  width: number,
  height: number,
  row_stride: number,
) {
  if (stSetBytesNeedsContext()) {
    const context = global.stage.context.get_backend().get_cogl_context();

    content.set_bytes(context, data, pixel_format, width, height, row_stride);
  } else {
    (content as any as OldImageContent).set_bytes(data, pixel_format, width, height, row_stride);
  }
}

// The vertical property of St widgets has been removed in v51 (deprecated in GNOME Shell 48).

function stHasOrientation(box: St.BoxLayout): boolean {
  return box.set_orientation !== undefined;
}

type BoxOrientationCompatType = { vertical: boolean } | { orientation: Clutter.Orientation };

export function getStBoxOrientationCompat(vertical: boolean): BoxOrientationCompatType {
  const box = new St.BoxLayout();

  if (stHasOrientation(box)) {
    return { orientation: vertical ? Clutter.Orientation.VERTICAL : Clutter.Orientation.HORIZONTAL };
  }

  return {
    vertical,
  };
}

export function stBoxSetVertical(box: St.BoxLayout, vertical: boolean): void {
  if (stHasOrientation(box)) {
    box.set_orientation(vertical ? Clutter.Orientation.VERTICAL : Clutter.Orientation.HORIZONTAL);
    return;
  }

  box.set_vertical(vertical);
}
