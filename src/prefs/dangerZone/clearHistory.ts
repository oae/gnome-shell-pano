import { ActionRow, Window } from '@gi-types/adw1';
import { DBus, DBusCallFlags } from '@gi-types/gio2';
import { Align, Button, ButtonsType, MessageDialog, ResponseType } from '@gi-types/gtk4';
import type { ExtensionBase } from '@pano/types/extension/extension';
import { registerGObjectClass } from '@pano/utils/gjs';
import { gettext } from '@pano/utils/shell';

@registerGObjectClass
export class ClearHistoryRow extends ActionRow {
  constructor(ext: ExtensionBase) {
    const _ = gettext(ext);
    super({
      title: _('Clear History'),
      subtitle: _('Clears the clipboard database and cache'),
    });

    const clearHistoryButton = new Button({
      css_classes: ['destructive-action'],
      label: _('Clear'),
      valign: Align.CENTER,
      halign: Align.CENTER,
    });
    clearHistoryButton.connect('clicked', () => {
      const md = new MessageDialog({
        text: _('Are you sure you want to clear history?'),
        transient_for: this.get_root() as Window,
        destroy_with_parent: true,
        modal: true,
        visible: true,
        buttons: ButtonsType.OK_CANCEL,
      });
      md.get_widget_for_response(ResponseType.OK)?.add_css_class('destructive-action');
      md.connect('response', (_, response) => {
        if (response === ResponseType.OK) {
          DBus.session.call(
            'org.gnome.Shell',
            '/io/elhan/Pano',
            'io.elhan.Pano',
            'clearHistory',
            null,
            null,
            DBusCallFlags.NONE,
            -1,
            null,
            null,
          );
        }

        md.destroy();
      });
    });

    this.add_suffix(clearHistoryButton);
  }
}
