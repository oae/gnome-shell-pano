import { PopupBaseMenuItem } from '@girs/gnome-shell/src/ui/popupMenu';

export {
  Ornament,
  PopupBaseMenuItem,
  PopupDummyMenu,
  PopupImageMenuItem,
  PopupMenu,
  PopupMenuBase,
  PopupMenuItem,
  PopupMenuManager,
  PopupMenuSection,
  //PopupSeparatorMenuItem,
  PopupSubMenu,
  PopupSubMenuMenuItem,
  PopupSwitchMenuItem,
} from '@girs/gnome-shell/src/ui/popupMenu';

export class PopupSeparatorMenuItem extends PopupBaseMenuItem {
  constructor();
  override _init(): void;
}
