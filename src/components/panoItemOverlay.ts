import Clutter from '@girs/clutter-16';
import GObject from '@girs/gobject-2.0';
import St from '@girs/st-16';
import { registerGObjectClass, SignalsDefinition } from '@pano/utils/gjs';

export type PanoItemOverlaySignalType = 'on-remove' | 'on-favorite';
interface PanoItemOverlaySignals extends SignalsDefinition<PanoItemOverlaySignalType> {
  'on-remove': Record<string, never>;
  'on-favorite': Record<string, never>;
}

@registerGObjectClass
export class PanoItemOverlay extends St.BoxLayout {
  static metaInfo: GObject.MetaInfo<Record<string, never>, Record<string, never>, PanoItemOverlaySignals> = {
    GTypeName: 'PanoItemOverlay',
    Signals: { 'on-remove': {}, 'on-favorite': {} },
  };

  private favoriteButton: St.Button;
  actionContainer: St.BoxLayout;

  constructor() {
    super({
      styleClass: 'pano-item-overlay',
      vertical: false,
      yAlign: Clutter.ActorAlign.FILL,
      xAlign: Clutter.ActorAlign.FILL,
      xExpand: true,
      yExpand: true,
    });

    this.actionContainer = new St.BoxLayout({
      styleClass: 'pano-item-actions',
      xExpand: true,
      yExpand: true,
      xAlign: Clutter.ActorAlign.END,
      yAlign: Clutter.ActorAlign.START,
    });

    const favoriteIcon = new St.Icon({ styleClass: 'pano-item-action-button-icon', iconName: 'view-pin-symbolic' });

    this.favoriteButton = new St.Button({
      styleClass: 'pano-item-action-button pano-item-favorite-button',
      child: favoriteIcon,
    });

    this.favoriteButton.connect('clicked', () => {
      this.emit('on-favorite');
      return Clutter.EVENT_PROPAGATE;
    });

    const removeIcon = new St.Icon({
      styleClass: 'pano-item-action-button-icon pano-item-action-button-remove-icon',
      iconName: 'user-trash-symbolic',
    });

    const removeButton = new St.Button({
      styleClass: 'pano-item-action-button pano-item-remove-button',
      child: removeIcon,
    });

    removeButton.connect('clicked', () => {
      this.emit('on-remove');
      return Clutter.EVENT_PROPAGATE;
    });

    this.actionContainer.add_child(this.favoriteButton);
    this.actionContainer.add_child(removeButton);

    this.add_child(this.actionContainer);
  }

  setVisibility(isVisible: boolean): void {
    this.actionContainer.visible = isVisible;
  }

  setFavorite(isFavorite: boolean): void {
    if (isFavorite) {
      this.favoriteButton.add_style_pseudo_class('active');
    } else {
      this.favoriteButton.remove_style_pseudo_class('active');
    }
  }
}
