import { KEY_Escape } from '@gi-types/clutter10';
import { Button } from '@gi-types/st1';
import * as dialog from '@gnome-shell/ui/dialog';
import { ModalDialog } from '@gnome-shell/ui/modalDialog';
import { registerGObjectClass } from '@pano/utils/gjs';
import { _, logger } from '@pano/utils/shell';

const debug = logger('clear-history-dialog');

@registerGObjectClass
export class ClearHistoryDialog extends ModalDialog {
  private cancelButton: Button;
  private clearButton: Button;
  private onClear: () => Promise<void>;

  constructor(onClear: () => Promise<void>) {
    super();

    this.onClear = onClear;

    this.cancelButton = this.addButton({
      label: _('Cancel'),
      action: this.onCancelButtonPressed.bind(this),
      key: KEY_Escape,
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

    this.contentLayout.add(content);
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
