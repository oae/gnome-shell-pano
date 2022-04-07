import { registerClass } from '@imports/gobject2';

export const PanoItem = registerClass(
  {},
  class PanoItem extends imports.ui.switcherPopup.SwitcherPopup {
    constructor(items) {
      super();
      this._items = items || [];
    }
  },
);
