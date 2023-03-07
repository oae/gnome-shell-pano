import { ActorAlign, EVENT_PROPAGATE } from '@gi-types/clutter10';
import { icon_new_for_string } from '@gi-types/gio2';
import { get_language_names_with_category } from '@gi-types/glib2';
import { MetaInfo } from '@gi-types/gobject2';
import { BoxLayout, Button, Icon, Label } from '@gi-types/st1';
import { registerGObjectClass } from '@pano/utils/gjs';
import { ICON_PACKS, IPanoItemType } from '@pano/utils/panoItemType';
import { getCurrentExtension, getCurrentExtensionSettings } from '@pano/utils/shell';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import * as dateLocale from 'date-fns/locale';

const langs = get_language_names_with_category('LC_MESSAGES').map(
  (l) => l.replaceAll('_', '').replaceAll('-', '').split('.')[0],
);
const localeKey = Object.keys(dateLocale).find((key) => langs.includes(key));

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
  actionContainer: BoxLayout;

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

    const settings = getCurrentExtensionSettings();
    const icon = new Icon({
      style_class: 'pano-item-title-icon',
      gicon: icon_new_for_string(
        `${getCurrentExtension().path}/icons/hicolor/scalable/actions/${ICON_PACKS[settings.get_uint('icon-pack')]}-${
          itemType.iconPath
        }`,
      ),
    });
    iconContainer.add_child(icon);
    settings.connect('changed::icon-pack', () => {
      icon.set_gicon(
        icon_new_for_string(
          `${getCurrentExtension().path}/icons/hicolor/scalable/actions/${ICON_PACKS[settings.get_uint('icon-pack')]}-${
            itemType.iconPath
          }`,
        ),
      );
    });

    titleContainer.add_child(
      new Label({
        text: itemType.title,
        style_class: 'pano-item-title',
        x_expand: true,
      }),
    );

    const dateLabel = new Label({
      text: formatDistanceToNow(date, { addSuffix: true, locale: localeKey ? dateLocale[localeKey] : undefined }),
      style_class: 'pano-item-date',
      x_expand: true,
      y_expand: true,
    });

    this.dateUpdateIntervalId = setInterval(() => {
      dateLabel.set_text(
        formatDistanceToNow(date, { addSuffix: true, locale: localeKey ? dateLocale[localeKey] : undefined }),
      );
    }, 60000);

    titleContainer.add_child(dateLabel);

    this.actionContainer = new BoxLayout({
      style_class: 'pano-item-actions',
      x_expand: false,
      y_expand: true,
      opacity: 0,
      x_align: ActorAlign.END,
      y_align: ActorAlign.START,
    });

    const favoriteIcon = new Icon({
      style_class: 'pano-item-action-button-icon',
      icon_name: 'starred-symbolic',
    });

    this.favoriteButton = new Button({
      style_class: 'pano-item-action-button pano-item-favorite-button',
      child: favoriteIcon,
    });

    this.favoriteButton.connect('clicked', () => {
      this.emit('on-favorite');
      return EVENT_PROPAGATE;
    });

    const removeIcon = new Icon({
      style_class: 'pano-item-action-button-icon pano-item-action-button-remove-icon',
      icon_name: 'window-close-symbolic',
    });

    const removeButton = new Button({
      style_class: 'pano-item-action-button pano-item-remove-button',
      child: removeIcon,
    });

    removeButton.connect('clicked', () => {
      this.emit('on-remove');
      return EVENT_PROPAGATE;
    });

    this.actionContainer.add_child(this.favoriteButton);
    this.actionContainer.add_child(removeButton);

    this.add_child(iconContainer);
    this.add_child(titleContainer);
    this.add_child(this.actionContainer);
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
