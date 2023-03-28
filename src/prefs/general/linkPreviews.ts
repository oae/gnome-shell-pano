import { ActionRow } from '@gi-types/adw1';
import { Settings, SettingsBindFlags } from '@gi-types/gio2';
import { Align, Switch } from '@gi-types/gtk4';
import { registerGObjectClass } from '@pano/utils/gjs';
import { _, getCurrentExtensionSettings } from '@pano/utils/shell';

@registerGObjectClass
export class LinkPreviewsRow extends ActionRow {
  private settings: Settings;

  constructor() {
    super({
      title: _('Link Previews'),
      subtitle: _('Allow Pano to visit links on your clipboard to generate link previews'),
    });

    this.settings = getCurrentExtensionSettings();

    const linkPreviews = new Switch({
      active: this.settings.get_boolean('link-previews'),
      valign: Align.CENTER,
      halign: Align.CENTER,
    });

    this.settings.bind('link-previews', linkPreviews, 'active', SettingsBindFlags.DEFAULT);

    this.add_suffix(linkPreviews);
    this.set_activatable_widget(linkPreviews);
  }
}
