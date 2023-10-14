import {
  BUTTON_MIDDLE,
  BUTTON_PRIMARY,
  BUTTON_SECONDARY,
  Event,
  EVENT_PROPAGATE,
  EventType,
} from '@gi-types/clutter10';
import { icon_new_for_string, Settings } from '@gi-types/gio2';
import { MetaInfo, TYPE_BOOLEAN } from '@gi-types/gobject2';
import { Icon } from '@gi-types/st1';
import { ClearHistoryDialog } from '@pano/components/indicator/clearHistoryDialog';
import { ClipboardManager } from '@pano/utils/clipboardManager';
import { registerGObjectClass } from '@pano/utils/gjs';
import { ICON_PACKS } from '@pano/utils/panoItemType';
import { _, getCurrentExtension, getCurrentExtensionSettings } from '@pano/utils/shell';
import { openExtensionPrefs, wiggle } from '@pano/utils/ui';
import * as panelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as popupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

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

  private settings: Settings;
  private incognitoChangeId: number;
  private clipboardChangeId: number;
  private icon: Icon;
  private ext: any;
  private clipboardManager: ClipboardManager;
  private onToggle: () => void;

  constructor(ext: any, clipboardManager: ClipboardManager, onClear: () => Promise<void>, onToggle: () => void) {
    super(0.5, 'Pano Indicator', false);

    this.ext = ext;
    this.clipboardManager = clipboardManager;
    this.onToggle = onToggle;
    this.settings = getCurrentExtensionSettings(this.ext);
    const isInIncognito = this.settings.get_boolean('is-in-incognito');

    this.icon = new Icon({
      gicon: icon_new_for_string(
        `${getCurrentExtension(this.ext).path}/icons/hicolor/scalable/actions/${
          ICON_PACKS[this.settings.get_uint('icon-pack')]
        }-indicator${isInIncognito ? '-incognito-symbolic' : '-symbolic'}.svg`,
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
        icon_new_for_string(
          `${getCurrentExtension(this.ext).path}/icons/hicolor/scalable/actions/${
            ICON_PACKS[this.settings.get_uint('icon-pack')]
          }-indicator${isInIncognito ? '-incognito-symbolic' : '-symbolic'}.svg`,
        ),
      );
    });

    this.settings.connect('changed::icon-pack', () => {
      const isInIncognito = this.settings.get_boolean('is-in-incognito');
      this.icon.set_gicon(
        icon_new_for_string(
          `${getCurrentExtension(this.ext).path}/icons/hicolor/scalable/actions/${
            ICON_PACKS[this.settings.get_uint('icon-pack')]
          }-indicator${isInIncognito ? '-incognito-symbolic' : '-symbolic'}.svg`,
        ),
      );
    });

    this.menu.addMenuItem(switchMenuItem);
    this.menu.addMenuItem(new popupMenu.PopupSeparatorMenuItem());
    const clearHistoryItem = new popupMenu.PopupMenuItem(_('Clear History'));
    clearHistoryItem.connect('activate', () => {
      const dialog = new ClearHistoryDialog(onClear);
      dialog.open();
    });
    this.menu.addMenuItem(clearHistoryItem);
    this.menu.addMenuItem(new popupMenu.PopupSeparatorMenuItem());
    const settingsItem = new popupMenu.PopupMenuItem(_('Settings'));
    settingsItem.connect('activate', () => {
      openExtensionPrefs(this.ext);
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
