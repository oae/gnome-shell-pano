import { BaselinePosition, Box, Notebook, Orientation } from '@gi-types/gtk4';
import { registerGObjectClass } from '@pano/utils/gjs';

@registerGObjectClass
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
}

const init = (): void => log('prefs initialized');

const buildPrefsWidget = () => new Preferences();

export default { init, buildPrefsWidget };
