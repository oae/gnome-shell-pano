import Adw from '@girs/adw-1';
import Gio from '@girs/gio-2.0';
import Gtk4 from '@girs/gtk-4.0';
import { ExtensionBase } from '@gnome-shell/extensions/extension';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getCurrentExtensionSettings, gettext } from '@pano/utils/shell';

@registerGObjectClass
export class SendNotificationOnCopyRow extends Adw.ActionRow {
  private settings: Gio.Settings;

  constructor(ext: ExtensionBase) {
    const _ = gettext(ext);

    super({
      title: _('Send Notification on Copy'),
      subtitle: _('Allow Pano to send notification when copying new content'),
    });

    this.settings = getCurrentExtensionSettings(ext);

    const sendNotificationOnCopySwitch = new Gtk4.Switch({
      active: this.settings.get_boolean('send-notification-on-copy'),
      valign: Gtk4.Align.CENTER,
      halign: Gtk4.Align.CENTER,
    });

    this.settings.bind(
      'send-notification-on-copy',
      sendNotificationOnCopySwitch,
      'active',
      Gio.SettingsBindFlags.DEFAULT,
    );

    this.add_suffix(sendNotificationOnCopySwitch);
    this.set_activatable_widget(sendNotificationOnCopySwitch);
  }
}
