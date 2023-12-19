import Adw from '@girs/adw-1';
import Gio from '@girs/gio-2.0';
import Gtk4 from '@girs/gtk-4.0';
import { ExtensionBase } from '@gnome-shell/extensions/extension';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getCurrentExtensionSettings, gettext } from '@pano/utils/shell';
@registerGObjectClass
export class PlayAudioOnCopyRow extends Adw.ActionRow {
  private settings: Gio.Settings;

  constructor(ext: ExtensionBase) {
    const _ = gettext(ext);
    super({
      title: _('Play an Audio on Copy'),
      subtitle: _('Allow Pano to play an audio when copying new content'),
    });

    this.settings = getCurrentExtensionSettings(ext);

    const playAudioOnCopySwitch = new Gtk4.Switch({
      active: this.settings.get_boolean('play-audio-on-copy'),
      valign: Gtk4.Align.CENTER,
      halign: Gtk4.Align.CENTER,
    });

    this.settings.bind('play-audio-on-copy', playAudioOnCopySwitch, 'active', Gio.SettingsBindFlags.DEFAULT);

    this.add_suffix(playAudioOnCopySwitch);
    this.set_activatable_widget(playAudioOnCopySwitch);
  }
}
