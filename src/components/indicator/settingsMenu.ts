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
import { registerGObjectClass } from '@pano/utils/gjs';
import { ICON_PACKS } from '@pano/utils/panoItemType';
import { _, getCurrentExtension, getCurrentExtensionSettings } from '@pano/utils/shell';
import { openExtensionPrefs } from '@pano/utils/ui';

const { PopupMenuItem, PopupSwitchMenuItem, PopupSeparatorMenuItem } = imports.ui.popupMenu;
const { Button: PopupMenuButton } = imports.ui.panelMenu;

@registerGObjectClass
export class SettingsMenu extends PopupMenuButton {
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
  private onToggle: () => void;

  constructor(onClear: () => Promise<void>, onToggle: () => void) {
    super(0.5, 'Pano Indicator', false);

    this.onToggle = onToggle;
    this.settings = getCurrentExtensionSettings();
    const isInIncognito = this.settings.get_boolean('is-in-incognito');

    const icon = new Icon({
      gicon: icon_new_for_string(
        `${getCurrentExtension().path}/icons/hicolor/scalable/actions/${
          ICON_PACKS[this.settings.get_uint('icon-pack')]
        }-indicator${isInIncognito ? '-incognito-symbolic' : '-symbolic'}.svg`,
      ),
      style_class: 'system-status-icon indicator-icon',
    });

    this.add_child(icon);

    const switchMenuItem = new PopupSwitchMenuItem(_('Incognito Mode'), this.settings.get_boolean('is-in-incognito'));

    switchMenuItem.connect('toggled', (item) => {
      this.settings.set_boolean('is-in-incognito', item.state);
    });

    this.incognitoChangeId = this.settings.connect('changed::is-in-incognito', () => {
      const isInIncognito = this.settings.get_boolean('is-in-incognito');
      switchMenuItem.setToggleState(isInIncognito);
      icon.set_gicon(
        icon_new_for_string(
          `${getCurrentExtension().path}/icons/hicolor/scalable/actions/indicator${
            isInIncognito ? '-incognito-symbolic' : '-symbolic'
          }.svg`,
        ),
      );
    });

    this.settings.connect('changed::icon-pack', () => {
      const isInIncognito = this.settings.get_boolean('is-in-incognito');
      icon.set_gicon(
        icon_new_for_string(
          `${getCurrentExtension().path}/icons/hicolor/scalable/actions/${
            ICON_PACKS[this.settings.get_uint('icon-pack')]
          }-indicator${isInIncognito ? '-incognito-symbolic' : '-symbolic'}.svg`,
        ),
      );
    });

    this.menu.addMenuItem(switchMenuItem);
    this.menu.addMenuItem(new PopupSeparatorMenuItem());
    const clearHistoryItem = new PopupMenuItem(_('Clear History'));
    clearHistoryItem.connect('activate', () => {
      const dialog = new ClearHistoryDialog(onClear);
      dialog.open();
    });
    this.menu.addMenuItem(clearHistoryItem);
    this.menu.addMenuItem(new PopupSeparatorMenuItem());
    const settingsItem = new PopupMenuItem(_('Settings'));
    settingsItem.connect('activate', () => {
      openExtensionPrefs();
    });
    this.menu.addMenuItem(settingsItem);
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
    this.settings.disconnect(this.incognitoChangeId);
    super.destroy();
  }
}
