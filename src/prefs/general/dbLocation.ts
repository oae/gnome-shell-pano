import Adw from '@girs/adw-1';
import Gio from '@girs/gio-2.0';
import Gtk4 from '@girs/gtk-4.0';
import { ExtensionBase } from '@pano/types/extension/extension';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getCurrentExtensionSettings, getDbPath, gettext } from '@pano/utils/shell';

@registerGObjectClass
export class DBLocationRow extends Adw.ActionRow {
  private fileChooser: Gtk4.FileChooserNative;
  private settings: Gio.Settings;

  constructor(ext: ExtensionBase) {
    const _ = gettext(ext);
    super({
      title: _('Database Location'),
      subtitle: `<b>${getDbPath(ext)}/pano.db</b>`,
    });

    this.settings = getCurrentExtensionSettings(ext);

    this.fileChooser = new Gtk4.FileChooserNative({
      modal: true,
      title: _('Choose pano database location'),
      action: Gtk4.FileChooserAction.SELECT_FOLDER,
      accept_label: 'Select',
    });
    this.connect('map', () => {
      this.fileChooser.set_transient_for(this.get_root() as Adw.Window);
    });
    this.fileChooser.set_current_folder(Gio.File.new_for_path(`${getDbPath(ext)}`));
    this.fileChooser.connect('response', (chooser, response) => {
      if (response !== Gtk4.ResponseType.ACCEPT) {
        this.fileChooser.hide();
        return;
      }

      const dir = chooser.get_file();
      if (dir && dir.query_exists(null) && !dir.get_child('pano.db').query_exists(null)) {
        const path = dir.get_path();
        if (path) {
          this.settings.set_string('database-location', path);
        }
      } else {
        const md = new Gtk4.MessageDialog({
          text: _('Failed to select directory'),
          transient_for: this.get_root() as Adw.Window,
          destroy_with_parent: true,
          modal: true,
          visible: true,
          buttons: Gtk4.ButtonsType.OK,
        });
        md.connect('response', () => {
          md.destroy();
        });
      }
      this.fileChooser.hide();
    });

    const dbLocationButton = new Gtk4.Button({
      icon_name: 'document-open-symbolic',
      valign: Gtk4.Align.CENTER,
      halign: Gtk4.Align.CENTER,
    });
    dbLocationButton.connect('clicked', () => {
      this.fileChooser.show();
    });
    this.add_suffix(dbLocationButton);
    this.set_activatable_widget(dbLocationButton);

    this.settings.connect('changed::database-location', () => {
      this.fileChooser.set_current_folder(Gio.File.new_for_path(`${getDbPath(ext)}`));
      this.set_subtitle(`<b>${getDbPath(ext)}/pano.db</b>`);
    });
  }
}
