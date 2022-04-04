import { logger } from '@pano/utils/shell';
import { registerClass } from '@imports/gobject2';
import { BaselinePosition, Box, Notebook, Orientation } from '@imports/gtk4';

const debug = logger('prefs');

const Preferences = registerClass(
  {},
  class Preferences extends Box {
    _init() {
      super._init({
        orientation: Orientation.VERTICAL,
        spacing: 10,
        baselinePosition: BaselinePosition.BOTTOM,
      });

      this.createNotebook();
    }

    createNotebook() {
      const notebook = new Notebook({
        hexpand: true,
        vexpand: true,
      });

      this.append(notebook);
    }
  },
);

const init = (): void => debug('prefs initialized');

const buildPrefsWidget = (): any => new Preferences();

export default { init, buildPrefsWidget };
