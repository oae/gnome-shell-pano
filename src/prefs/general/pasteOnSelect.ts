import { ActionRow } from '@gi-types/adw1';
import { Settings, SettingsBindFlags } from '@gi-types/gio2';
import { Align, Switch } from '@gi-types/gtk4';
import { ExtensionBase } from '@gnome-shell/extensions/extension';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getCurrentExtensionSettings, gettext } from '@pano/utils/shell';

@registerGObjectClass
export class PasteOnSelectRow extends ActionRow {
  private settings: Settings;

  constructor(ext: ExtensionBase) {
    const _ = gettext(ext);
    super({
      title: _('Paste on Select'),
      subtitle: _('Allow Pano to paste content on select'),
    });

    this.settings = getCurrentExtensionSettings(ext);

    const pasteOnSelectSwitch = new Switch({
      active: this.settings.get_boolean('paste-on-select'),
      valign: Align.CENTER,
      halign: Align.CENTER,
    });

    this.settings.bind('paste-on-select', pasteOnSelectSwitch, 'active', SettingsBindFlags.DEFAULT);

    this.add_suffix(pasteOnSelectSwitch);
    this.set_activatable_widget(pasteOnSelectSwitch);
  }
}
