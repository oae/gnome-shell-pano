import { icon_new_for_string, Settings } from '@gi-types/gio2';
import { MetaInfo, TYPE_BOOLEAN } from '@gi-types/gobject2';
import { Icon } from '@gi-types/st1';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getCurrentExtension, getCurrentExtensionSettings, _ } from '@pano/utils/shell';
import { openExtensionPrefs } from '@pano/utils/ui';
import { ClearHistoryDialog } from './clearHistoryDialog';

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

  constructor(onClear: () => Promise<void>, onToggle: () => void) {
    super(0.5, 'Pano Indicator', false);

    this.settings = getCurrentExtensionSettings();
    const isInIncognito = this.settings.get_boolean('is-in-incognito');

    const icon = new Icon({
      gicon: icon_new_for_string(
        `${getCurrentExtension().path}/icons/indicator${isInIncognito ? '-incognito' : ''}.svg`,
      ),
      style_class: 'system-status-icon indicator-icon',
    });

    this.add_child(icon);

    const togglePanoItem = new PopupMenuItem(_('Toggle Pano'));
    togglePanoItem.connect('activate', () => {
      this.menu.close(false);
      onToggle();
    });
    this.menu.addMenuItem(togglePanoItem);
    this.menu.addMenuItem(new PopupSeparatorMenuItem());

    const switchMenuItem = new PopupSwitchMenuItem(_('Incognito Mode'), this.settings.get_boolean('is-in-incognito'));

    switchMenuItem.connect('toggled', (item) => {
      this.settings.set_boolean('is-in-incognito', item.state);
    });

    this.incognitoChangeId = this.settings.connect('changed::is-in-incognito', () => {
      const isInIncognito = this.settings.get_boolean('is-in-incognito');
      switchMenuItem.setToggleState(isInIncognito);
      icon.set_gicon(
        icon_new_for_string(`${getCurrentExtension().path}/icons/indicator${isInIncognito ? '-incognito' : ''}.svg`),
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
  destroy() {
    this.settings.disconnect(this.incognitoChangeId);
    super.destroy();
  }
}
