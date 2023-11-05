export {
  ButtonInfo,
  Dialog,
  ListSection,
  ListSectionItem,
  //MessageDialogContent,
} from '@girs/gnome-shell/src/ui/dialog';

import type St from '@girs/st-12';

export interface MessageDialogContentProps {
  title?: string;
  description?: string;
}

export class MessageDialogContent extends St.BoxLayout {
  public title: string;
  public description: string;

  constructor(params: St.BoxLayout.ConstructorProperties & MessageDialogContentProps);
  public _init(params: St.BoxLayout.ConstructorProperties & MessageDialogContentProps): void;

  protected _onDestroy(): void;
  protected _updateTitleStyle(): void;
}
