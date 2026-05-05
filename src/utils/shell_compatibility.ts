import Clutter from '@girs/clutter-18';
import Cogl from '@girs/cogl-18';
import GLib from '@girs/glib-2.0';
import Meta from '@girs/meta-18';
import Shell from '@girs/shell-18';
import St from '@girs/st-18';

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

// Meta.Cursor was removed and Cursor lives in Clutter since Gnome 50 (Meta 18 / Clutter 18), it was renamed to CursorType (at least the thing we expect)

export type MetaCursorType = typeof Clutter.CursorType;

interface LegacyMetaWithCursor {
  Cursor: MetaCursorType | null | undefined;
}

const usesOldMetaCursor: boolean = (() => {
  const cursor = (Meta as unknown as LegacyMetaWithCursor).Cursor;

  if (cursor !== undefined && cursor !== null) {
    return true;
  }

  return false;
})();

export const MetaCursor: MetaCursorType = (() => {
  if (usesOldMetaCursor) {
    return (Meta as unknown as LegacyMetaWithCursor).Cursor!;
  }

  return Clutter.CursorType;
})();

// Meta.Cursor.POINTING_HAND was renamed to Meta.Cursor.POINTER in GNOME 48 (Meta 16)

interface LegacyMetaCursor {
  POINTING_HAND: Clutter.CursorType | null | undefined;
}

export const MetaCursorPointer: Clutter.CursorType = (() => {
  if (usesOldMetaCursor) {
    const pointer = ((Meta as unknown as LegacyMetaWithCursor).Cursor as unknown as LegacyMetaCursor).POINTING_HAND;

    if (pointer !== undefined && pointer !== null) {
      return pointer;
    }

    return (Meta as unknown as LegacyMetaWithCursor).Cursor!.POINTER;
  }
  return Clutter.CursorType.POINTER;
})();

export const MetaCursorDefault: Clutter.CursorType = (() => {
  if (usesOldMetaCursor) {
    return (Meta as unknown as LegacyMetaWithCursor).Cursor!.DEFAULT;
  }

  return Clutter.CursorType.DEFAULT;
})();

// changing CursorType, (previously Cursor) was moved since Gnome 50 (Meta 18 / Clutter 18), previously it was in the global shell display, now it is a method on Clutter.Actor

interface LegacyMetaDisplay {
  set_cursor?: undefined | ((cursor_type: Clutter.CursorType | null) => void);
}

export function setCursorType(actor: Clutter.Actor, cursor_type: Clutter.CursorType): void {
  const set_cursor_fn = (Shell.Global.get().display as LegacyMetaDisplay).set_cursor;

  if (set_cursor_fn !== undefined) {
    set_cursor_fn(MetaCursorDefault);
    return;
  }

  actor.set_cursor_type(cursor_type);
}

// actual compatibility functions

export type OrientationReturnType = { vertical: boolean } | { orientation: Clutter.Orientation };

export function orientationCompatibility(vertical: boolean): OrientationReturnType {
  if (stOrientationIsSupported()) {
    return { orientation: vertical ? Clutter.Orientation.VERTICAL : Clutter.Orientation.HORIZONTAL };
  }

  return { vertical: vertical };
}

const global = Shell.Global.get();

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
