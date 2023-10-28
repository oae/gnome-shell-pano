import {
  BUTTON_MIDDLE,
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  Event,
  EVENT_PROPAGATE,
  EventType,
} from '@gi-types/clutter10';
import Gio from '@gi-types/gio2';
import { MetaInfo, TYPE_BOOLEAN } from '@gi-types/gobject2';
import St1 from '@gi-types/st1';
import { ExtensionBase } from '@gnome-shell/extensions/extension';
import * as panelMenu from '@gnome-shell/ui/panelMenu';
import * as popupMenu from '@gnome-shell/ui/popupMenu';
import { ClearHistoryDialog } from '@pano/components/indicator/clearHistoryDialog';
import { ClipboardManager } from '@pano/utils/clipboardManager';
import { registerGObjectClass } from '@pano/utils/gjs';
import { ICON_PACKS } from '@pano/utils/panoItemType';
import { getCurrentExtensionSettings, gettext } from '@pano/utils/shell';
import { openExtensionPreferences, wiggle } from '@pano/utils/ui';

@registerGObjectClass
export class SettingsMenu extends panelMenu.Button {
  static metaInfo: MetaInfo = {
    GTypeName: 'SettingsButton',
    Signals: {
      'item-selected': {},
      'menu-state-changed': {
        param_types: [TYPE_BOOLEAN],
        accumulator: 0,
      },
    },
  };

  private settings: Gio.Settings;
  private incognitoChangeId: number;
  private clipboardChangeId: number;
  private icon: St1.Icon;
  private ext: ExtensionBase;
  private clipboardManager: ClipboardManager;
  private onToggle: () => void;

  constructor(
    ext: ExtensionBase,
    clipboardManager: ClipboardManager,
    onClear: () => Promise<void>,
    onToggle: () => void,
  ) {
    const _ = gettext(ext);
    super(0.5, 'Pano Indicator', false);

    this.ext = ext;
    this.clipboardManager = clipboardManager;
    this.onToggle = onToggle;
    this.settings = getCurrentExtensionSettings(this.ext);
    const isInIncognito = this.settings.get_boolean('is-in-incognito');

    this.icon = new St1.Icon({
      gicon: Gio.icon_new_for_string(
        `${this.ext.path}/icons/hicolor/scalable/actions/${ICON_PACKS[this.settings.get_uint('icon-pack')]}-indicator${
          isInIncognito ? '-incognito-symbolic' : '-symbolic'
        }.svg`,
      ),
      style_class: 'system-status-icon indicator-icon',
    });

    this.add_child(this.icon);

    const switchMenuItem = new popupMenu.PopupSwitchMenuItem(
      _('Incognito Mode'),
      this.settings.get_boolean('is-in-incognito'),
    );

    switchMenuItem.connect('toggled', (item) => {
      this.settings.set_boolean('is-in-incognito', item.state);
    });

    this.incognitoChangeId = this.settings.connect('changed::is-in-incognito', () => {
      const isInIncognito = this.settings.get_boolean('is-in-incognito');
      switchMenuItem.setToggleState(isInIncognito);
      this.icon.set_gicon(
        Gio.icon_new_for_string(
          `${this.ext.path}/icons/hicolor/scalable/actions/${
            ICON_PACKS[this.settings.get_uint('icon-pack')]
          }-indicator${isInIncognito ? '-incognito-symbolic' : '-symbolic'}.svg`,
        ),
      );
    });

    this.settings.connect('changed::icon-pack', () => {
      const isInIncognito = this.settings.get_boolean('is-in-incognito');
      this.icon.set_gicon(
        Gio.icon_new_for_string(
          `${this.ext.path}/icons/hicolor/scalable/actions/${
            ICON_PACKS[this.settings.get_uint('icon-pack')]
          }-indicator${isInIncognito ? '-incognito-symbolic' : '-symbolic'}.svg`,
        ),
      );
    });

    this.menu.addMenuItem(switchMenuItem);
    this.menu.addMenuItem(new popupMenu.PopupSeparatorMenuItem());
    const clearHistoryItem = new popupMenu.PopupMenuItem(_('Clear History'));
    clearHistoryItem.connect('activate', () => {
      const dialog = new ClearHistoryDialog(this.ext, onClear);
      dialog.open();
    });
    this.menu.addMenuItem(clearHistoryItem);
    this.menu.addMenuItem(new popupMenu.PopupSeparatorMenuItem());
    const settingsItem = new popupMenu.PopupMenuItem(_('Settings'));
    settingsItem.connect('activate', () => {
      openExtensionPreferences(this.ext);
    });
    this.menu.addMenuItem(settingsItem);
    this.clipboardChangeId = clipboardManager.connect('changed', this.animate.bind(this));
  }

  private animate() {
    if (this.settings.get_boolean('wiggle-indicator')) {
      wiggle(this.icon, { duration: 100, offset: 2, wiggleCount: 3 });
    }
  }

  vfunc_event(event: Event) {
    if (!this.menu || event.type() !== EventType.BUTTON_PRESS) {
      return EVENT_PROPAGATE;
    }

    if (event.get_button() === BUTTON_PRIMARY || event.get_button() === BUTTON_MIDDLE) {
      this.onToggle();
    } else if (event.get_button() === BUTTON_SECONDARY) {
      this.menu.toggle();
    }

    return EVENT_PROPAGATE;
  }

  destroy() {
    if (this.clipboardChangeId) {
      this.clipboardManager.disconnect(this.clipboardChangeId);
    }
    if (this.incognitoChangeId) {
      this.settings.disconnect(this.incognitoChangeId);
    }
    super.destroy();
  }
}
