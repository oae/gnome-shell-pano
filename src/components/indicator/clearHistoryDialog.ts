import Clutter from '@girs/clutter-12';
import type St from '@girs/st-12';
import * as dialog from '@gnome-shell/ui/dialog';
import * as modalDialog from '@gnome-shell/ui/modalDialog';
import type { ExtensionBase } from '@pano/types/extension/extension';
import { registerGObjectClass } from '@pano/utils/gjs';
import { gettext, logger } from '@pano/utils/shell';
const debug = logger('clear-history-dialog');

@registerGObjectClass
export class ClearHistoryDialog extends modalDialog.ModalDialog {
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

    const content = new dialog.MessageDialogContent({
      title: _('Clear History'),
      description: _('Are you sure you want to clear history?'),
    });

    this.contentLayout.vfunc_add(content);
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
