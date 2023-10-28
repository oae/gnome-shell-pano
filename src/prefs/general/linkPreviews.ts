import Adw from '@girs/adw-1';
import Gio from '@girs/gio-2.0';
import Gtk4 from '@girs/gtk-4.0';
import { ExtensionBase } from '@gnome-shell/extensions/extension';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getCurrentExtensionSettings, gettext } from '@pano/utils/shell';
@registerGObjectClass
export class LinkPreviewsRow extends Adw.ActionRow {
  private settings: Gio.Settings;

  constructor(ext: ExtensionBase) {
    const _ = gettext(ext);
    super({
      title: _('Link Previews'),
      subtitle: _('Allow Pano to visit links on your clipboard to generate link previews'),
    });

    this.settings = getCurrentExtensionSettings(ext);

    const linkPreviews = new Gtk4.Switch({
      active: this.settings.get_boolean('link-previews'),
      valign: Gtk4.Align.CENTER,
      halign: Gtk4.Align.CENTER,
    });

    this.settings.bind('link-previews', linkPreviews, 'active', Gio.SettingsBindFlags.DEFAULT);

    this.add_suffix(linkPreviews);
    this.set_activatable_widget(linkPreviews);
  }
}
