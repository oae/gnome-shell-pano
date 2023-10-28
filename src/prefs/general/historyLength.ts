import { ActionRow } from '@gi-types/adw1';
import Gio from '@gi-types/gio2';
import Gtk4 from '@gi-types/gtk4';
import { ExtensionBase } from '@gnome-shell/extensions/extension';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getCurrentExtensionSettings, gettext } from '@pano/utils/shell';

@registerGObjectClass
export class HistoryLengthRow extends ActionRow {
  private settings: Gio.Settings;

  constructor(ext: ExtensionBase) {
    const _ = gettext(ext);
    super({
      title: _('History Length'),
      subtitle: _('You can limit your clipboard history length between 10 - 500'),
    });

    this.settings = getCurrentExtensionSettings(ext);

    const historyEntry = new Gtk4.SpinButton({
      adjustment: new Gtk4.Adjustment({ step_increment: 10, lower: 10, upper: 500 }),
      value: this.settings.get_int('history-length'),
      valign: Gtk4.Align.CENTER,
      halign: Gtk4.Align.CENTER,
    });

    this.settings.bind('history-length', historyEntry, 'value', Gio.SettingsBindFlags.DEFAULT);

    this.add_suffix(historyEntry);
    this.set_activatable_widget(historyEntry);
  }
}
