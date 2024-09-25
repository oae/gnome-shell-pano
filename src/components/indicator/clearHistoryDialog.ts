import Clutter from '@girs/clutter-15';
import type { ExtensionBase } from '@girs/gnome-shell/dist/extensions/sharedInternals';
import { MessageDialogContent } from '@girs/gnome-shell/dist/ui/dialog';
import { ModalDialog } from '@girs/gnome-shell/dist/ui/modalDialog';
import type St from '@girs/st-15';
import { registerGObjectClass } from '@pano/utils/gjs';
import { gettext, logger } from '@pano/utils/shell';
const debug = logger('clear-history-dialog');

@registerGObjectClass
export class ClearHistoryDialog extends ModalDialog {
  private cancelButton: St.Button;
  private clearButton: St.Button;
  private onClear: () => Promise<void>;

  constructor(ext: ExtensionBase, onClear: () => Promise<void>) {
    super();
    const _ = gettext(ext);

    this.onClear = onClear;

    this.cancelButton = this.addButton({
      label: _('Cancel'),
      action: this.onCancelButtonPressed.bind(this),
      key: Clutter.KEY_Escape,
      default: true,
    });

    this.clearButton = this.addButton({
      label: _('Clear'),
      action: this.onClearButtonPressed.bind(this),
    });

    const content = new MessageDialogContent({
      title: _('Clear History'),
      description: _('Are you sure you want to clear history?'),
    });

    this.contentLayout.add_child(content);
  }

  private onCancelButtonPressed() {
    this.close();
  }

  private async onClearButtonPressed() {
    this.cancelButton.set_reactive(false);
    this.clearButton.set_reactive(false);
    this.clearButton.set_label('Clearing...');
    try {
      await this.onClear();
    } catch (err) {
      debug(`err: ${err}`);
    }
    this.close();
  }
}
