import Clutter from '@girs/clutter-12';
import Gio from '@girs/gio-2.0';
import GLib from '@girs/glib-2.0';
import GObject from '@girs/gobject-2.0';
import Graphene from '@girs/graphene-1.0';
import Meta from '@girs/meta-12';
import Shell from '@girs/shell-12';
import St1 from '@girs/st-12';
import { ExtensionBase } from '@gnome-shell/extensions/extension';
import { PanoItemHeader } from '@pano/components/panoItemHeader';
import { ClipboardManager } from '@pano/utils/clipboardManager';
import { getV13ButtonEvent, getV13KeyEvent } from '@pano/utils/compatibility';
import { DBItem } from '@pano/utils/db';
import { registerGObjectClass, SignalRepresentationType, SignalsDefinition } from '@pano/utils/gjs';
import { getPanoItemTypes } from '@pano/utils/panoItemType';
import { getCurrentExtensionSettings } from '@pano/utils/shell';
import { getVirtualKeyboard, WINDOW_POSITIONS } from '@pano/utils/ui';

export type PanoItemSignalType = 'on-remove' | 'on-favorite' | 'activated';

interface PanoItemSignals extends SignalsDefinition<PanoItemSignalType> {
  activated: Record<string, never>;
  'on-remove': SignalRepresentationType<[GObject.GType<string>]>;
  'on-favorite': SignalRepresentationType<[GObject.GType<string>]>;
}

@registerGObjectClass
export class PanoItem extends St1.BoxLayout {
  static metaInfo: GObject.MetaInfo<Record<string, never>, Record<string, never>, PanoItemSignals> = {
    GTypeName: 'PanoItem',
    Signals: {
      activated: {},
      'on-remove': {
        param_types: [GObject.TYPE_STRING],
        accumulator: 0,
      },
      'on-favorite': {
        param_types: [GObject.TYPE_STRING],
        accumulator: 0,
      },
    },
  };

  protected header: PanoItemHeader;
  private timeoutId: number | undefined;
  protected body: St1.BoxLayout;
  protected clipboardManager: ClipboardManager;
  public dbItem: DBItem;
  protected settings: Gio.Settings;
  private selected: boolean;

  constructor(ext: ExtensionBase, clipboardManager: ClipboardManager, dbItem: DBItem) {
    super({
      name: 'pano-item',
      visible: true,
      pivot_point: Graphene.Point.alloc().init(0.5, 0.5),
      reactive: true,
      style_class: 'pano-item',
      vertical: true,
      track_hover: true,
    });

    this.clipboardManager = clipboardManager;
    this.dbItem = dbItem;

    this.settings = getCurrentExtensionSettings(ext);

    this.connect('key-focus-in', () => this.setSelected(true));
    this.connect('key-focus-out', () => this.setSelected(false));
    this.connect('enter-event', () => {
      Shell.Global.get().display.set_cursor(Meta.Cursor.POINTING_HAND);
      if (!this.selected) {
        this.set_style(`border: 4px solid ${this.settings.get_string('hovered-item-border-color')}`);
      }
    });
    this.connect('leave-event', () => {
      Shell.Global.get().display.set_cursor(Meta.Cursor.DEFAULT);
      if (!this.selected) {
        this.set_style('');
      }
    });

    this.connect('activated', () => {
      this.get_parent()?.get_parent()?.get_parent()?.hide();

      if (this.dbItem.itemType === 'LINK' && this.settings.get_boolean('open-links-in-browser')) {
        return;
      }

      if (this.settings.get_boolean('paste-on-select')) {
        // See https://github.com/SUPERCILEX/gnome-clipboard-history/blob/master/extension.js#L606
        this.timeoutId = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 250, () => {
          getVirtualKeyboard().notify_keyval(
            Clutter.get_current_event_time(),
            Clutter.KEY_Control_L,
            Clutter.KeyState.RELEASED,
          );
          getVirtualKeyboard().notify_keyval(
            Clutter.get_current_event_time(),
            Clutter.KEY_Control_L,
            Clutter.KeyState.PRESSED,
          );
          getVirtualKeyboard().notify_keyval(Clutter.get_current_event_time(), Clutter.KEY_v, Clutter.KeyState.PRESSED);
          getVirtualKeyboard().notify_keyval(
            Clutter.get_current_event_time(),
            Clutter.KEY_Control_L,
            Clutter.KeyState.RELEASED,
          );
          getVirtualKeyboard().notify_keyval(
            Clutter.get_current_event_time(),
            Clutter.KEY_v,
            Clutter.KeyState.RELEASED,
          );
          if (this.timeoutId) {
            GLib.Source.remove(this.timeoutId);
          }
          this.timeoutId = undefined;
          return GLib.SOURCE_REMOVE;
        });
      }
    });

    this.header = new PanoItemHeader(ext, getPanoItemTypes(ext)[dbItem.itemType], dbItem.copyDate);
    this.header.setFavorite(this.dbItem.isFavorite);
    this.header.connect('on-remove', () => {
      this.emit('on-remove', JSON.stringify(this.dbItem));
      return Clutter.EVENT_PROPAGATE;
    });

    this.header.connect('on-favorite', () => {
      this.dbItem = { ...this.dbItem, isFavorite: !this.dbItem.isFavorite };
      this.emit('on-favorite', JSON.stringify(this.dbItem));
      return Clutter.EVENT_PROPAGATE;
    });

    this.connect('on-favorite', () => {
      this.header.setFavorite(this.dbItem.isFavorite);
      return Clutter.EVENT_PROPAGATE;
    });

    this.body = new St1.BoxLayout({
      style_class: 'pano-item-body',
      clip_to_allocation: true,
      vertical: true,
      x_align: Clutter.ActorAlign.FILL,
      y_align: Clutter.ActorAlign.FILL,
      x_expand: true,
      y_expand: true,
    });

    this.add_child(this.header);
    this.add_child(this.body);

    const themeContext = St1.ThemeContext.get_for_stage(Shell.Global.get().get_stage());

    themeContext.connect('notify::scale-factor', () => {
      this.setBodyDimensions();
    });
    this.settings.connect('changed::item-size', () => {
      this.setBodyDimensions();
    });
    this.settings.connect('changed::window-position', () => {
      this.setBodyDimensions();
    });

    this.setBodyDimensions();
  }

  private setBodyDimensions() {
    const pos = this.settings.get_uint('window-position');
    if (pos === WINDOW_POSITIONS.LEFT || pos === WINDOW_POSITIONS.RIGHT) {
      this.set_x_align(Clutter.ActorAlign.FILL);
      this.set_y_align(Clutter.ActorAlign.START);
    } else {
      this.set_x_align(Clutter.ActorAlign.START);
      this.set_y_align(Clutter.ActorAlign.FILL);
    }
    const { scale_factor } = St1.ThemeContext.get_for_stage(Shell.Global.get().get_stage());
    this.body.set_height(this.settings.get_int('item-size') * scale_factor - this.header.get_height());
    this.body.set_width(this.settings.get_int('item-size') * scale_factor);
  }

  private setSelected(selected: boolean) {
    if (selected) {
      const activeItemBorderColor = this.settings.get_string('active-item-border-color');
      this.set_style(`border: 4px solid ${activeItemBorderColor} !important;`);
      this.grab_key_focus();
    } else {
      this.set_style('');
    }
    this.selected = selected;
  }
  override vfunc_key_press_event(_event: Clutter.KeyEvent): boolean {
    const event = getV13KeyEvent(_event);
    if (
      event.get_key_symbol() === Clutter.KEY_Return ||
      event.get_key_symbol() === Clutter.KEY_ISO_Enter ||
      event.get_key_symbol() === Clutter.KEY_KP_Enter
    ) {
      this.emit('activated');
      return Clutter.EVENT_STOP;
    }
    if (event.get_key_symbol() === Clutter.KEY_Delete || event.get_key_symbol() === Clutter.KEY_KP_Delete) {
      this.emit('on-remove', JSON.stringify(this.dbItem));
      return Clutter.EVENT_STOP;
    }
    if (
      (event.get_key_symbol() === Clutter.KEY_S || event.get_key_symbol() === Clutter.KEY_s) &&
      event.get_state() === Clutter.ModifierType.CONTROL_MASK
    ) {
      this.dbItem = { ...this.dbItem, isFavorite: !this.dbItem.isFavorite };
      this.emit('on-favorite', JSON.stringify(this.dbItem));
      return Clutter.EVENT_STOP;
    }
    return Clutter.EVENT_PROPAGATE;
  }

  override vfunc_button_release_event(_event: Clutter.ButtonEvent): boolean {
    const event = getV13ButtonEvent(_event);
    if (event.get_button() === 1) {
      this.emit('activated');
      return Clutter.EVENT_STOP;
    }

    return Clutter.EVENT_PROPAGATE;
  }

  override destroy(): void {
    if (this.timeoutId) {
      GLib.Source.remove(this.timeoutId);
    }
    this.header.destroy();
    super.destroy();
  }
}
