import { ActionRow } from '@gi-types/adw1';
import { Settings, SettingsBindFlags } from '@gi-types/gio2';
import { Align, Switch } from '@gi-types/gtk4';
import { ExtensionBase } from '@gnome-shell/extensions/extension';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getCurrentExtensionSettings, gettext } from '@pano/utils/shell';
@registerGObjectClass
export class PlayAudioOnCopyRow extends ActionRow {
  private settings: Settings;

  constructor(ext: ExtensionBase) {
    const _ = gettext(ext);
    super({
      title: _('Play an Audio on Copy'),
      subtitle: _('Allow Pano to play an audio when copying new content'),
    });

    this.settings = getCurrentExtensionSettings(ext);

    const playAudioOnCopySwitch = new Switch({
      active: this.settings.get_boolean('play-audio-on-copy'),
      valign: Align.CENTER,
      halign: Align.CENTER,
    });

    this.settings.bind('play-audio-on-copy', playAudioOnCopySwitch, 'active', SettingsBindFlags.DEFAULT);

    this.add_suffix(playAudioOnCopySwitch);
    this.set_activatable_widget(playAudioOnCopySwitch);
  }
}
