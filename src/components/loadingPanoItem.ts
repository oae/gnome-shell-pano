import Clutter from '@girs/clutter-14';
import * as Animation from '@girs/gnome-shell/dist/ui/animation';
import GObject from '@girs/gobject-2.0';
import Graphene from '@girs/graphene-1.0';
import St from '@girs/st-14';
import type { DBItem } from '@pano/utils/db';
import { registerGObjectClass, SignalsDefinition } from '@pano/utils/gjs';

export type LoadingPanoItemSignalType = 'activated';

interface LoadingPanoItemSignals extends SignalsDefinition<LoadingPanoItemSignalType> {
  activated: Record<string, never>;
}

@registerGObjectClass
export class LoadingPanoItem extends St.BoxLayout {
  static metaInfo: GObject.MetaInfo<Record<string, never>, Record<string, never>, LoadingPanoItemSignals> = {
    GTypeName: 'LoadingPanoItem',
    Signals: {
      activated: {},
    },
  };

  readonly dbItem: DBItem;

  constructor(dbItem: DBItem) {
    super({
      name: 'loading-pano-item',
      visible: true,
      pivotPoint: Graphene.Point.alloc().init(0.5, 0.5),
      reactive: true,
      styleClass: 'loading-pano-item',
      vertical: true,
      trackHover: true,
    });

    this.dbItem = dbItem;

    //TODO
    //@ts-expect-error
    const spinner: Clutter.Actor = new Animation.Spinner(32, { animate: true });

    const spinnerContainer = new St.Bin({
      yExpand: true,
      xExpand: true,
      child: spinner,
    });

    this.add_child(spinnerContainer);

    //@ts-expect-error
    spinner.play();

    this.connect('activated', () => {
      //do nothing
    });
  }
}
