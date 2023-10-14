export {
  State,
  //ModalDialog
} from '@girs/gnome-shell/src/ui/modalDialog';

import { State } from '@girs/gnome-shell/src/ui/modalDialog';
import type Shell from '@girs/shell-12';
import type St from '@girs/st-12';

import { Dialog } from '../dialog';
import { MonitorConstraint } from '../layout';

// this is a slightly modified copy of the export from '@girs/gnome-shell/src/ui/modalDialog'

export namespace ModalDialog {
  export interface ConstructorProperties {
    shellReactive: boolean;
    styleClass: string | null;
    actionMode: Shell.ActionMode;
    shouldFadeIn: boolean;
    shouldFadeOut: boolean;
    destroyOnClose: boolean;
  }
}

export class ModalDialog extends St.Widget {
  protected _state: State;
  protected _hasModal: boolean;
  protected _actionMode: Shell.ActionMode;
  protected _shellReactive: boolean;
  protected _shouldFadeIn: boolean;
  protected _shouldFadeOut: boolean;
  protected _destroyOnClose: boolean;
  protected _backgroundBin: St.Bin;
  protected _monitorConstraint: MonitorConstraint;
  protected _initialKeyFocus: St.Widget | null;
  protected _initialKeyFocusDestroyId: number;
  protected _savedKeyFocus: St.Widget | null;

  public backgroundStack: St.Widget;
  public dialogLayout: Dialog;
  public contentLayout: Dialog['contentLayout'];
  public buttonLayout: Dialog['buttonLayout'];
  public state: State;

  constructor(params?: ModalDialog.ConstructorProperties);

  /** @hidden */
  public _init(params?: St.Widget.ConstructorProperties): void;
  public _init(params?: ModalDialog.ConstructorProperties): void;

  protected _setState(state: State): void;
  protected _fadeOpen(onPrimary: boolean): void;
  protected _closeComplete(): void;
  /**
   * This method is like close, but fades the dialog out much slower,
   * and leaves the lightbox in place. Once in the faded out state,
   * the dialog can be brought back by an open call, or the lightbox
   * can be dismissed by a close call.
   *
   * The main point of this method is to give some indication to the user
   * that the dialog response has been acknowledged but will take a few
   * moments before being processed.
   * e.g., if a user clicked "Log Out" then the dialog should go away
   * immediately, but the lightbox should remain until the logout is
   * complete.
   * @param timestamp
   */
  protected _fadeOutDialog(timestamp: number): void;

  public clearButtons(): void;
  public setButtons(buttons: any[]): void;
  public addButton(buttonInfo: any): St.Button;
  public setInitialKeyFocus(actor: St.Widget): void;
  public open(timestamp?: number, onPrimary?: boolean): boolean;
  public close(timestamp?: number): boolean;
  /**
   * Drop modal status without closing the dialog; this makes the
   * dialog insensitive as well, so it needs to be followed shortly
   * by either a close() or a pushModal()
   * @param timestamp
   */
  public popModal(timestamp: number): void;
  public pushModal(timestamp: number): void;
}
