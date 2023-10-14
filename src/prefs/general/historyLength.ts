import { ActionRow } from '@gi-types/adw1';
import { Settings, SettingsBindFlags } from '@gi-types/gio2';
import { Adjustment, Align, SpinButton } from '@gi-types/gtk4';
import { ExtensionBase } from '@gnome-shell/extensions/extension';
import { registerGObjectClass } from '@pano/utils/gjs';
import { _, getCurrentExtensionSettings } from '@pano/utils/shell';

@registerGObjectClass
export class HistoryLengthRow extends ActionRow {
  private settings: Settings;

  constructor(ext: ExtensionBase) {
    super({
      title: _('History Length'),
      subtitle: _('You can limit your clipboard history length between 10 - 500'),
    });

    this.settings = getCurrentExtensionSettings(ext);

    const historyEntry = new SpinButton({
      adjustment: new Adjustment({ step_increment: 10, lower: 10, upper: 500 }),
      value: this.settings.get_int('history-length'),
      valign: Align.CENTER,
      halign: Align.CENTER,
    });

    this.settings.bind('history-length', historyEntry, 'value', SettingsBindFlags.DEFAULT);

    this.add_suffix(historyEntry);
    this.set_activatable_widget(historyEntry);
  }
}
