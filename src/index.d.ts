declare const imports: {
  lang: any;
  ui: {
    layout: any;
    main: {
      notify: (arg: string) => void;
      panel: any;
      wm: any;
      layoutManager: {
        monitors: Monitor[];
        primaryIndex: number;
      };
    };
    panelMenu: any;
    popupMenu: any;
    switcherPopup: {
      SwitcherPopup: any;
    };
  };
  misc: {
    extensionUtils: {
      getCurrentExtension: () => any;
      getSettings: () => any;
    };
    config: any;
  };
  byteArray: {
    fromString: (input: string) => Uint8Array;
    fromArray: (input: number[]) => any;
    fromGBytes: (input: any) => Uint8Array;
    toString: (x: Uint8Array) => string;
  };
};
declare interface Monitor {
  width: number;
  height: number;
  x: number;
  y: number;
}

declare const log: (arg: any) => void;
declare const _: (arg: string) => string;
