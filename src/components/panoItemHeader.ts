import { ActorAlign, EVENT_PROPAGATE } from '@gi-types/clutter10';
import { icon_new_for_string } from '@gi-types/gio2';
import { MetaInfo } from '@gi-types/gobject2';
import { BoxLayout, Button, Icon, Label } from '@gi-types/st1';
import { registerGObjectClass } from '@pano/utils/gjs';
import { IPanoItemType } from '@pano/utils/panoItemType';
import { getCurrentExtension } from '@pano/utils/shell';
import { formatDistanceToNow } from 'date-fns';

@registerGObjectClass
export class PanoItemHeader extends BoxLayout {
  static metaInfo: MetaInfo = {
    GTypeName: 'PanoItemHeader',
    Signals: {
      'on-remove': {},
      'on-favorite': {},
    },
  };

  private dateUpdateIntervalId: any;
  private favoriteButton: Button;

  constructor(itemType: IPanoItemType, date: Date) {
    super({
      style_class: `pano-item-header pano-item-header-${itemType.classSuffix}`,
      vertical: false,
      x_expand: true,
      y_expand: false,
      x_align: ActorAlign.FILL,
      y_align: ActorAlign.START,
    });

    const titleContainer = new BoxLayout({
      style_class: 'pano-item-title-container',
      vertical: true,
      x_expand: true,
    });
    const iconContainer = new BoxLayout({
      style_class: 'pano-icon-container',
    });

    iconContainer.add_child(
      new Icon({
        gicon: icon_new_for_string(`${getCurrentExtension().path}/icons/hicolor/scalable/actions/${itemType.iconPath}`),
      }),
    );

    titleContainer.add_child(
      new Label({
        text: itemType.title,
        style_class: 'pano-item-title',
        x_expand: true,
      }),
    );

    const dateLabel = new Label({
      text: formatDistanceToNow(date, { addSuffix: true }),
      style_class: 'pano-item-date',
      x_expand: true,
      y_expand: true,
    });

    this.dateUpdateIntervalId = setInterval(() => {
      dateLabel.set_text(formatDistanceToNow(date, { addSuffix: true }));
    }, 60000);

    titleContainer.add_child(dateLabel);

    const actionContainer = new BoxLayout({
      style_class: 'pano-item-actions',
      x_expand: false,
      y_expand: true,
      x_align: ActorAlign.END,
      y_align: ActorAlign.START,
    });

    const favoriteIcon = new Icon({
      icon_name: 'starred-symbolic',
      icon_size: 10,
    });

    this.favoriteButton = new Button({
      style_class: 'pano-item-favorite-button',
      child: favoriteIcon,
    });

    this.favoriteButton.connect('clicked', () => {
      this.emit('on-favorite');
      return EVENT_PROPAGATE;
    });

    const removeIcon = new Icon({
      icon_name: 'window-close-symbolic',
      icon_size: 10,
    });

    const removeButton = new Button({
      style_class: 'pano-item-remove-button',
      child: removeIcon,
    });

    removeButton.connect('clicked', () => {
      this.emit('on-remove');
      return EVENT_PROPAGATE;
    });

    actionContainer.add_child(this.favoriteButton);
    actionContainer.add_child(removeButton);

    this.add_child(iconContainer);
    this.add_child(titleContainer);
    this.add_child(actionContainer);
  }

  setFavorite(isFavorite: boolean): void {
    if (isFavorite) {
      this.favoriteButton.add_style_pseudo_class('active');
    } else {
      this.favoriteButton.remove_style_pseudo_class('active');
    }
  }

  override destroy(): void {
    clearInterval(this.dateUpdateIntervalId);
    super.destroy();
  }
}
