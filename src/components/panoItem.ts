import Clutter from '@girs/clutter-14';
import Gio from '@girs/gio-2.0';
import GLib from '@girs/glib-2.0';
import type { ExtensionBase } from '@girs/gnome-shell/dist/extensions/sharedInternals';
import GObject from '@girs/gobject-2.0';
import Graphene from '@girs/graphene-1.0';
import Meta from '@girs/meta-14';
import Shell from '@girs/shell-14';
import St from '@girs/st-14';
import { PanoItemHeader } from '@pano/components/panoItemHeader';
import { PanoItemOverlay } from '@pano/components/panoItemOverlay';
import { ClipboardManager } from '@pano/utils/clipboardManager';
import { DBItem } from '@pano/utils/db';
import { registerGObjectClass, SignalRepresentationType, SignalsDefinition } from '@pano/utils/gjs';
import { getPanoItemTypes } from '@pano/utils/panoItemType';
import { getCurrentExtensionSettings } from '@pano/utils/shell';
import { getHeaderHeight, getVirtualKeyboard, isVisible, WINDOW_POSITIONS } from '@pano/utils/ui';

export type PanoItemSignalType = 'on-remove' | 'on-favorite' | 'activated';

interface PanoItemSignals extends SignalsDefinition<PanoItemSignalType> {
  activated: Record<string, never>;
  'on-remove': SignalRepresentationType<[GObject.GType<string>]>;
  'on-favorite': SignalRepresentationType<[GObject.GType<string>]>;
}

@registerGObjectClass
export class PanoItem extends St.Widget {
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

  private timeoutId: number | undefined;
  protected container: St.BoxLayout;
  protected header: PanoItemHeader;
  protected body: St.BoxLayout;
  protected overlay: PanoItemOverlay;
  protected clipboardManager: ClipboardManager;
  public dbItem: DBItem;
  protected settings: Gio.Settings;
  private hovered: boolean = false;
  private selected: boolean = false;
  private showControlsOnHover: boolean;

  constructor(ext: ExtensionBase, clipboardManager: ClipboardManager, dbItem: DBItem) {
    super({
      name: 'pano-item',
      styleClass: 'pano-item',
      layoutManager: new Clutter.BinLayout(),
      visible: true,
      pivotPoint: Graphene.Point.alloc().init(0.5, 0.5),
      reactive: true,
      trackHover: true,
      xExpand: false,
      yExpand: false,
    });

    this.clipboardManager = clipboardManager;
    this.dbItem = dbItem;

    this.settings = getCurrentExtensionSettings(ext);

    this.connect('key-focus-in', () => this.setSelected(true));
    this.connect('key-focus-out', () => this.setSelected(false));
    this.connect('enter-event', () => this.setHovered(true));
    this.connect('leave-event', () => this.setHovered(false));

    this.connect('activated', () => {
      this.get_parent()?.get_parent()?.get_parent()?.hide();

      if (this.settings.get_boolean('paste-on-select') && this.clipboardManager.isTracking) {
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

    const itemType = getPanoItemTypes(ext)[this.dbItem.itemType];
    this.add_style_class_name(`pano-item-${itemType.classSuffix}`);

    this.container = new St.BoxLayout({
      styleClass: 'pano-item-container',
      clipToAllocation: true,
      vertical: true,
      xAlign: Clutter.ActorAlign.FILL,
      yAlign: Clutter.ActorAlign.FILL,
      xExpand: true,
      yExpand: true,
    });

    this.header = new PanoItemHeader(ext, itemType, this.dbItem.copyDate);

    this.body = new St.BoxLayout({
      styleClass: 'pano-item-body',
      clipToAllocation: true,
      vertical: true,
      xAlign: Clutter.ActorAlign.FILL,
      yAlign: Clutter.ActorAlign.FILL,
      xExpand: true,
      yExpand: true,
    });

    this.container.add_child(this.header);
    this.container.add_child(this.body);

    this.overlay = new PanoItemOverlay();
    this.overlay.setFavorite(this.dbItem.isFavorite);
    this.overlay.connect('on-remove', () => {
      this.emit('on-remove', JSON.stringify(this.dbItem));
      return Clutter.EVENT_PROPAGATE;
    });

    this.overlay.connect('on-favorite', () => {
      this.dbItem = { ...this.dbItem, isFavorite: !this.dbItem.isFavorite };
      this.emit('on-favorite', JSON.stringify(this.dbItem));
      return Clutter.EVENT_PROPAGATE;
    });

    this.connect('on-favorite', () => {
      this.overlay.setFavorite(this.dbItem.isFavorite);
      return Clutter.EVENT_PROPAGATE;
    });

    this.add_child(this.container);
    this.add_child(this.overlay);

    const themeContext = St.ThemeContext.get_for_stage(Shell.Global.get().get_stage());

    if (this.settings.get_boolean('compact-mode')) {
      this.add_style_class_name('compact');
    }

    themeContext.connect('notify::scale-factor', this.setBodyDimensions.bind(this));
    this.settings.connect('changed::item-width', this.setBodyDimensions.bind(this));
    this.settings.connect('changed::item-height', this.setBodyDimensions.bind(this));
    this.settings.connect('changed::header-style', this.setBodyDimensions.bind(this));
    this.settings.connect('changed::compact-mode', () => {
      if (this.settings.get_boolean('compact-mode')) {
        this.add_style_class_name('compact');
      } else {
        this.remove_style_class_name('compact');
      }
      this.setBodyDimensions();
    });
    this.settings.connect('changed::window-position', this.setBodyDimensions.bind(this));

    this.setBodyDimensions();

    this.showControlsOnHover = this.settings.get_boolean('show-controls-on-hover');
    this.overlay.setVisibility(!this.showControlsOnHover);
    this.settings.connect('changed::show-controls-on-hover', () => {
      this.showControlsOnHover = this.settings.get_boolean('show-controls-on-hover');
      this.overlay.setVisibility(!this.showControlsOnHover);
    });
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
    const { scaleFactor } = St.ThemeContext.get_for_stage(Shell.Global.get().get_stage());
    const mult = this.settings.get_boolean('compact-mode') ? 0.5 : 1;
    const header = getHeaderHeight(this.settings.get_uint('header-style'));
    const height = Math.floor(this.settings.get_int('item-height') * mult) + header;

    this.set_height(height * scaleFactor);
    this.container.set_width((this.settings.get_int('item-width') - 2) * scaleFactor);
    // -2*4 for the border
    this.container.set_height((height - 8) * scaleFactor);
    this.body.set_height((height - 10 - header) * scaleFactor);
    this.overlay.set_height((height - 8) * scaleFactor);
    this.header.visible = isVisible(this.settings.get_uint('header-style'));
  }

  private setSelected(selected: boolean) {
    if (selected) {
      this.grab_key_focus();
    }
    this.selected = selected;
    this.updateActive();
  }

  private setHovered(hovered: boolean) {
    Shell.Global.get().display.set_cursor(hovered ? Meta.Cursor.POINTING_HAND : Meta.Cursor.DEFAULT);
    this.hovered = hovered;
    this.updateActive();
  }

  private updateActive() {
    if (this.hovered || this.selected) {
      this.add_style_class_name('active');
      this.set_style(`border: 4px solid ${this.settings.get_string('active-item-border-color')};`);
    } else {
      this.remove_style_class_name('active');
      this.set_style('');
    }
  }

  // The style-changed event is used here instead of the enter and leave events because those events
  // retrigger when the pointer hovers over the buttons in the controls.
  override vfunc_style_changed(): void {
    if (this.showControlsOnHover) {
      this.overlay.setVisibility(this.hover || this.selected);
    }
  }

  override vfunc_key_press_event(event: Clutter.Event): boolean {
    switch (event.get_key_symbol()) {
      case Clutter.KEY_Return:
      case Clutter.KEY_ISO_Enter:
      case Clutter.KEY_KP_Enter:
        this.emit('activated');
        return Clutter.EVENT_STOP;

      case Clutter.KEY_Delete:
      case Clutter.KEY_KP_Delete:
        this.emit('on-remove', JSON.stringify(this.dbItem));
        return Clutter.EVENT_STOP;

      case Clutter.KEY_S:
      case Clutter.KEY_s:
        if (event.has_control_modifier()) {
          this.dbItem = { ...this.dbItem, isFavorite: !this.dbItem.isFavorite };
          this.emit('on-favorite', JSON.stringify(this.dbItem));
          return Clutter.EVENT_STOP;
        }
        break;
    }

    return Clutter.EVENT_PROPAGATE;
  }

  override vfunc_button_release_event(event: Clutter.Event): boolean {
    switch (event.get_button()) {
      case Clutter.BUTTON_PRIMARY:
        this.emit('activated');
        return Clutter.EVENT_STOP;

      // Delete item on middle click
      case Clutter.BUTTON_MIDDLE:
        if (this.settings.get_boolean('remove-on-middle-click')) {
          this.emit('on-remove', JSON.stringify(this.dbItem));
          return Clutter.EVENT_STOP;
        }
    }

    return Clutter.EVENT_PROPAGATE;
  }

  override vfunc_touch_event(event: Clutter.Event): boolean {
    if (event.type() === Clutter.EventType.TOUCH_END) {
      this.emit('activated');
      return Clutter.EVENT_STOP;
    }
    return Clutter.EVENT_PROPAGATE;
  }

  override destroy(): void {
    if (this.timeoutId) {
      GLib.Source.remove(this.timeoutId);
      this.timeoutId = undefined;
    }
    this.header.destroy();
    super.destroy();
  }
}
