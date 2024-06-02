import Clutter from '@girs/clutter-14';
import GObject from '@girs/gobject-2.0';
import St from '@girs/st-14';
import { isDark } from '@pano/utils/color';
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
    Signals: {
      'on-remove': {},
      'on-favorite': {},
    },
  };

  private isVisible = false;
  private isFavorite = false;
  private favoriteButton: St.Button;
  private favoriteIcon: St.Icon;
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

    const favoriteIcon = new St.Icon({
      styleClass: 'pano-item-action-button-icon',
      iconName: 'view-pin-symbolic',
    });

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

    this.favoriteIcon = new St.Icon({
      styleClass: 'pano-favorite-icon',
      iconName: 'view-pin-symbolic',
      xExpand: true,
      yExpand: true,
      xAlign: Clutter.ActorAlign.END,
      yAlign: Clutter.ActorAlign.START,
    });

    this.add_child(this.actionContainer);
    this.add_child(this.favoriteIcon);
  }

  setControlsBackground(color: string): void {
    this.actionContainer.set_style(`background-color: ${color}`);
    this.favoriteIcon.set_style(`background-color: ${color};`);
    const buttonColor = isDark(color) ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)';
    for (const child of this.actionContainer.get_children()) {
      if (child instanceof St.Button) {
        child.set_style(`background-color: ${buttonColor}`);
      }
    }
  }

  setVisibility(isVisible: boolean): void {
    this.isVisible = isVisible;
    this.actionContainer.visible = isVisible;
    this.favoriteIcon.visible = !isVisible && this.isFavorite;
  }

  setFavorite(isFavorite: boolean): void {
    this.isFavorite = isFavorite;
    this.favoriteIcon.visible = !this.isVisible && isFavorite;
    if (isFavorite) {
      this.favoriteButton.add_style_pseudo_class('active');
    } else {
      this.favoriteButton.remove_style_pseudo_class('active');
    }
  }
}
