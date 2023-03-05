import { ActionRow, Window } from '@gi-types/adw1';
import { File, Settings } from '@gi-types/gio2';
import {
  Align,
  Button,
  ButtonsType,
  FileChooserAction,
  FileChooserNative,
  MessageDialog,
  ResponseType,
} from '@gi-types/gtk4';
import { registerGObjectClass } from '@pano/utils/gjs';
import { _, getCurrentExtensionSettings, getDbPath } from '@pano/utils/shell';

@registerGObjectClass
export class DBLocationRow extends ActionRow {
  private fileChooser: FileChooserNative;
  private settings: Settings;

  constructor() {
    super({
      title: _('Database Location'),
      subtitle: `<b>${getDbPath()}/pano.db</b>`,
    });

    this.settings = getCurrentExtensionSettings();

    this.fileChooser = new FileChooserNative({
      modal: true,
      title: _('Choose pano database location'),
      action: FileChooserAction.SELECT_FOLDER,
      accept_label: 'Select',
    });
    this.connect('map', () => {
      this.fileChooser.set_transient_for(this.get_root() as Window);
    });
    this.fileChooser.set_current_folder(File.new_for_path(`${getDbPath()}`));
    this.fileChooser.connect('response', (chooser, response) => {
      if (response !== ResponseType.ACCEPT) {
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
        const md = new MessageDialog({
          text: _('Failed to select directory'),
          transient_for: this.get_root() as Window,
          destroy_with_parent: true,
          modal: true,
          visible: true,
          buttons: ButtonsType.OK,
        });
        md.connect('response', () => {
          md.destroy();
        });
      }
      this.fileChooser.hide();
    });

    const dbLocationButton = new Button({
      icon_name: 'document-open-symbolic',
      valign: Align.CENTER,
      halign: Align.CENTER,
    });
    dbLocationButton.connect('clicked', () => {
      this.fileChooser.show();
    });
    this.add_suffix(dbLocationButton);
    this.set_activatable_widget(dbLocationButton);

    this.settings.connect('changed::database-location', () => {
      this.fileChooser.set_current_folder(File.new_for_path(`${getDbPath()}`));
      this.set_subtitle(`<b>${getDbPath()}/pano.db</b>`);
    });
  }
}
