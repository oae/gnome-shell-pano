import { external_binding_name_for_action, KeyBindingAction, KeyBindingFlags } from '@imports/meta10';
import { ActionMode, Global } from '@imports/shell0';
import { logger, wm } from '@pano/utils/shell';

const debug = logger('key-manager');

/**
 * From https://superuser.com/questions/471606/gnome-shell-extension-key-binding
 */
export class KeyManager {
  private grabbers: any;

  constructor() {
    this.grabbers = {};

    Global.get().display.connect('accelerator-activated', (_, action) => {
      this.onAccelerator(action);
    });
  }

  stopListening(): void {
    Object.keys(this.grabbers).forEach((grabberAction) => {
      const grabber = this.grabbers[grabberAction];
      Global.get().display.ungrab_accelerator(grabber.action);
      wm.allowKeybinding(grabber.name, ActionMode.NONE);
    });
  }

  listenFor(accelerator: string, callback: () => any): void {
    debug(`Trying to listen for hot key [accelerator=${accelerator}]`);
    const action = Global.get().display.grab_accelerator(accelerator, KeyBindingFlags.NONE);

    if (action == KeyBindingAction.NONE) {
      debug(`Unable to grab accelerator [binding=${accelerator}]`);
    } else {
      debug(`Grabbed accelerator [action=${action}]`);
      const name = external_binding_name_for_action(action);
      debug(`Received binding name for action [name=${name}, action=${action}]`);

      wm.allowKeybinding(name, ActionMode.ALL);

      this.grabbers[action] = {
        name: name,
        accelerator: accelerator,
        callback: callback,
        action: action,
      };
    }
  }

  private onAccelerator(action: number): void {
    const grabber = this.grabbers[action];

    if (grabber) {
      grabber.callback();
    } else {
      debug(`No listeners [action=${action}]`);
    }
  }
}
