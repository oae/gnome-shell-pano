import { ActionRow } from '@gi-types/adw1';
import { Settings, SettingsBindFlags } from '@gi-types/gio2';
import { Align, Switch } from '@gi-types/gtk4';
import { registerGObjectClass } from '@pano/utils/gjs';
import { _, getCurrentExtensionSettings } from '@pano/utils/shell';

@registerGObjectClass
export class SendNotificationOnCopyRow extends ActionRow {
  private settings: Settings;

  constructor(ext: Extension) {
    super({
      title: _('Send Notification on Copy'),
      subtitle: _('Allow Pano to send notification when copying new content'),
    });

    this.settings = getCurrentExtensionSettings(ext);

    const sendNotificationOnCopySwitch = new Switch({
      active: this.settings.get_boolean('send-notification-on-copy'),
      valign: Align.CENTER,
      halign: Align.CENTER,
    });

    this.settings.bind('send-notification-on-copy', sendNotificationOnCopySwitch, 'active', SettingsBindFlags.DEFAULT);

    this.add_suffix(sendNotificationOnCopySwitch);
    this.set_activatable_widget(sendNotificationOnCopySwitch);
  }
}
