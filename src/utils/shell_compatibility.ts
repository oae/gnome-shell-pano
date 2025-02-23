import Clutter from '@girs/clutter-16';
import Cogl from '@girs/cogl-16';
import GLib from '@girs/glib-2.0';
import Meta from '@girs/meta-16';
import Shell from '@girs/shell-16';
import St from '@girs/st-16';

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

// actual compatibility functions

export type OrientationReturnType = { vertical: boolean } | { orientation: Clutter.Orientation };

export function orientationCompatibility(vertical: boolean): OrientationReturnType {
  if (stOrientationIsSupported()) {
    return { orientation: vertical ? Clutter.Orientation.VERTICAL : Clutter.Orientation.HORIZONTAL };
  }

  return { vertical: vertical };
}

export function setOrientationCompatibility(container: St.BoxLayout, vertical: boolean): void {
  if (stOrientationIsSupported()) {
    container.vertical = vertical;
  } else {
    container.orientation = vertical ? Clutter.Orientation.VERTICAL : Clutter.Orientation.HORIZONTAL;
  }
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
  pixel_format: Cogl.PixelFormat | null,
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
