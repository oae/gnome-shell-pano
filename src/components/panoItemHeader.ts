import { ActorAlign, EVENT_PROPAGATE } from '@gi-types/clutter10';
import { icon_new_for_string, Settings } from '@gi-types/gio2';
import { get_language_names_with_category } from '@gi-types/glib2';
import { MetaInfo } from '@gi-types/gobject2';
import { Global } from '@gi-types/shell0';
import { BoxLayout, Button, Icon, Label, ThemeContext } from '@gi-types/st1';
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
  private settings: Settings;
  private titleLabel: Label;
  private dateLabel: Label;
  actionContainer: BoxLayout;
  titleContainer: BoxLayout;
  iconContainer: BoxLayout;
  itemType: IPanoItemType;

  constructor(itemType: IPanoItemType, date: Date) {
    super({
      style_class: `pano-item-header pano-item-header-${itemType.classSuffix}`,
      vertical: false,
    });
    this.itemType = itemType;
    this.titleContainer = new BoxLayout({
      style_class: 'pano-item-title-container',
      vertical: true,
      x_expand: true,
    });
    this.iconContainer = new BoxLayout({
      style_class: 'pano-icon-container',
    });

    this.settings = getCurrentExtensionSettings();

    const themeContext = ThemeContext.get_for_stage(Global.get().get_stage());

    this.set_height(56 * themeContext.scale_factor);

    themeContext.connect('notify::scale-factor', () => {
      this.set_height(56 * themeContext.scale_factor);
    });

    const icon = new Icon({
      style_class: 'pano-item-title-icon',
      gicon: icon_new_for_string(
        `${getCurrentExtension().path}/icons/hicolor/scalable/actions/${
          ICON_PACKS[this.settings.get_uint('icon-pack')]
        }-${itemType.iconPath}`,
      ),
    });
    this.iconContainer.add_child(icon);
    this.settings.connect('changed::icon-pack', () => {
      icon.set_gicon(
        icon_new_for_string(
          `${getCurrentExtension().path}/icons/hicolor/scalable/actions/${
            ICON_PACKS[this.settings.get_uint('icon-pack')]
          }-${itemType.iconPath}`,
        ),
      );
    });

    this.titleLabel = new Label({
      text: itemType.title,
      style_class: 'pano-item-title',
      x_expand: true,
    });

    this.titleContainer.add_child(this.titleLabel);

    this.dateLabel = new Label({
      text: formatDistanceToNow(date, { addSuffix: true, locale: localeKey ? dateLocale[localeKey] : undefined }),
      style_class: 'pano-item-date',
      x_expand: true,
      y_expand: true,
      x_align: ActorAlign.FILL,
      y_align: ActorAlign.CENTER,
    });

    this.dateUpdateIntervalId = setInterval(() => {
      this.dateLabel.set_text(
        formatDistanceToNow(date, { addSuffix: true, locale: localeKey ? dateLocale[localeKey] : undefined }),
      );
    }, 60000);

    this.titleContainer.add_child(this.dateLabel);

    this.actionContainer = new BoxLayout({
      style_class: 'pano-item-actions',
      x_expand: true,
      y_expand: true,
      x_align: ActorAlign.END,
      y_align: ActorAlign.START,
    });

    const favoriteIcon = new Icon({
      style_class: 'pano-item-action-button-icon',
      icon_name: 'view-pin-symbolic',
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
      icon_name: 'user-trash-symbolic',
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

    this.add_child(this.iconContainer);
    this.add_child(this.titleContainer);
    this.add_child(this.actionContainer);

    this.setStyle();
    this.settings.connect('changed::item-title-font-family', this.setStyle.bind(this));
    this.settings.connect('changed::item-title-font-size', this.setStyle.bind(this));
    this.settings.connect('changed::item-date-font-family', this.setStyle.bind(this));
    this.settings.connect('changed::item-date-font-size', this.setStyle.bind(this));
  }

  private setStyle() {
    const itemTitleFontFamily = this.settings.get_string('item-title-font-family');
    const itemTitleFontSize = this.settings.get_int('item-title-font-size');
    const itemDateFontFamily = this.settings.get_string('item-date-font-family');
    const itemDateFontSize = this.settings.get_int('item-date-font-size');
    this.titleLabel.set_style(`font-family: ${itemTitleFontFamily}; font-size: ${itemTitleFontSize}px;`);
    this.dateLabel.set_style(`font-family: ${itemDateFontFamily}; font-size: ${itemDateFontSize}px;`);
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
