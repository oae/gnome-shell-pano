declare const imports: {
  lang: any;
  ui: {
    main: {
      notify: (arg: string) => void;
      panel: any;
    };
    panelMenu: any;
    popupMenu: any;
  };
  misc: {
    extensionUtils: {
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
declare const log: (arg: any) => void;
declare const _: (arg: string) => string;
