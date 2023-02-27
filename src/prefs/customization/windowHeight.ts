import { ActionRow } from '@gi-types/adw1';
import { Settings, SettingsBindFlags } from '@gi-types/gio2';
import { Adjustment, Align, SpinButton } from '@gi-types/gtk4';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getCurrentExtensionSettings, _ } from '@pano/utils/shell';

@registerGObjectClass
export class WindowHeightRow extends ActionRow {
  private settings: Settings;

  constructor() {
    super({
      title: _('Window Height'),
      subtitle: _('You can change the window height'),
    });

    this.settings = getCurrentExtensionSettings();

    const windowHeightEntry = new SpinButton({
      adjustment: new Adjustment({ step_increment: 5, lower: 200, upper: 1000 }),
      value: this.settings.get_int('window-height'),
      valign: Align.CENTER,
      halign: Align.CENTER,
    });

    this.settings.bind('window-height', windowHeightEntry, 'value', SettingsBindFlags.DEFAULT);

    this.add_suffix(windowHeightEntry);
    this.set_activatable_widget(windowHeightEntry);
  }
}
