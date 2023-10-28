import { ActionRow } from '@gi-types/adw1';
import Gio from '@gi-types/gio2';
import { Align, Switch } from '@gi-types/gtk4';
import { ExtensionBase } from '@gnome-shell/extensions/extension';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getCurrentExtensionSettings, gettext } from '@pano/utils/shell';
@registerGObjectClass
export class LinkPreviewsRow extends ActionRow {
  private settings: Gio.Settings;

  constructor(ext: ExtensionBase) {
    const _ = gettext(ext);
    super({
      title: _('Link Previews'),
      subtitle: _('Allow Pano to visit links on your clipboard to generate link previews'),
    });

    this.settings = getCurrentExtensionSettings(ext);

    const linkPreviews = new Switch({
      active: this.settings.get_boolean('link-previews'),
      valign: Align.CENTER,
      halign: Align.CENTER,
    });

    this.settings.bind('link-previews', linkPreviews, 'active', Gio.SettingsBindFlags.DEFAULT);

    this.add_suffix(linkPreviews);
    this.set_activatable_widget(linkPreviews);
  }
}
