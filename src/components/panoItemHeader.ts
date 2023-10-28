import Clutter from '@girs/clutter-12';
import Gio from '@girs/gio-2.0';
import GLib from '@girs/glib-2.0';
import GObject from '@girs/gobject-2.0';
import Shell from '@girs/shell-12';
import St1 from '@girs/st-12';
import { ExtensionBase } from '@gnome-shell/extensions/extension';
import { registerGObjectClass, SignalsDefinition } from '@pano/utils/gjs';
import { ICON_PACKS, IPanoItemType } from '@pano/utils/panoItemType';
import { getCurrentExtensionSettings } from '@pano/utils/shell';
import formatDistanceToNow from 'date-fns/formatDistanceToNow';
import * as dateLocale from 'date-fns/locale';

const langs = GLib.get_language_names_with_category('LC_MESSAGES').map(
  (l) => l.replaceAll('_', '').replaceAll('-', '').split('.')[0],
);
const localeKey = Object.keys(dateLocale).find((key) => langs.includes(key));

export type PanoItemHeaderSignalType = 'on-remove' | 'on-favorite';
interface PanoItemHeaderSignals extends SignalsDefinition<PanoItemHeaderSignalType> {
  'on-remove': Record<string, never>;
  'on-favorite': Record<string, never>;
}

@registerGObjectClass
export class PanoItemHeader extends St1.BoxLayout {
  static metaInfo: GObject.MetaInfo<Record<string, never>, Record<string, never>, PanoItemHeaderSignals> = {
    GTypeName: 'PanoItemHeader',
    Signals: {
      'on-remove': {},
      'on-favorite': {},
    },
  };

  private dateUpdateIntervalId: any;
  private favoriteButton: St1.Button;
  private settings: Gio.Settings;
  private titleLabel: St1.Label;
  private dateLabel: St1.Label;
  actionContainer: St1.BoxLayout;
  titleContainer: St1.BoxLayout;
  iconContainer: St1.BoxLayout;
  itemType: IPanoItemType;

  constructor(ext: ExtensionBase, itemType: IPanoItemType, date: Date) {
    super({
      style_class: `pano-item-header pano-item-header-${itemType.classSuffix}`,
      vertical: false,
    });
    this.itemType = itemType;
    this.titleContainer = new St1.BoxLayout({
      style_class: 'pano-item-title-container',
      vertical: true,
      x_expand: true,
    });
    this.iconContainer = new St1.BoxLayout({
      style_class: 'pano-icon-container',
    });

    this.settings = getCurrentExtensionSettings(ext);

    const themeContext = St1.ThemeContext.get_for_stage(Shell.Global.get().get_stage());

    this.set_height(56 * themeContext.scale_factor);

    themeContext.connect('notify::scale-factor', () => {
      this.set_height(56 * themeContext.scale_factor);
    });

    const icon = new St1.Icon({
      style_class: 'pano-item-title-icon',
      gicon: Gio.icon_new_for_string(
        `${ext.path}/icons/hicolor/scalable/actions/${ICON_PACKS[this.settings.get_uint('icon-pack')]}-${
          itemType.iconPath
        }`,
      ),
    });
    this.iconContainer.add_child(icon);
    this.settings.connect('changed::icon-pack', () => {
      icon.set_gicon(
        Gio.icon_new_for_string(
          `${ext.path}/icons/hicolor/scalable/actions/${ICON_PACKS[this.settings.get_uint('icon-pack')]}-${
            itemType.iconPath
          }`,
        ),
      );
    });

    this.titleLabel = new St1.Label({
      text: itemType.title,
      style_class: 'pano-item-title',
      x_expand: true,
    });

    this.titleContainer.add_child(this.titleLabel);

    this.dateLabel = new St1.Label({
      text: formatDistanceToNow(date, { addSuffix: true, locale: localeKey ? dateLocale[localeKey] : undefined }),
      style_class: 'pano-item-date',
      x_expand: true,
      y_expand: true,
      x_align: Clutter.ActorAlign.FILL,
      y_align: Clutter.ActorAlign.CENTER,
    });

    this.dateUpdateIntervalId = setInterval(() => {
      this.dateLabel.set_text(
        formatDistanceToNow(date, { addSuffix: true, locale: localeKey ? dateLocale[localeKey] : undefined }),
      );
    }, 60000);

    this.titleContainer.add_child(this.dateLabel);

    this.actionContainer = new St1.BoxLayout({
      style_class: 'pano-item-actions',
      x_expand: true,
      y_expand: true,
      x_align: Clutter.ActorAlign.END,
      y_align: Clutter.ActorAlign.START,
    });

    const favoriteIcon = new St1.Icon({
      style_class: 'pano-item-action-button-icon',
      icon_name: 'starred-symbolic',
    });

    this.favoriteButton = new St1.Button({
      style_class: 'pano-item-action-button pano-item-favorite-button',
      child: favoriteIcon,
    });

    this.favoriteButton.connect('clicked', () => {
      this.emit('on-favorite');
      return Clutter.EVENT_PROPAGATE;
    });

    const removeIcon = new St1.Icon({
      style_class: 'pano-item-action-button-icon pano-item-action-button-remove-icon',
      icon_name: 'window-close-symbolic',
    });

    const removeButton = new St1.Button({
      style_class: 'pano-item-action-button pano-item-remove-button',
      child: removeIcon,
    });

    removeButton.connect('clicked', () => {
      this.emit('on-remove');
      return Clutter.EVENT_PROPAGATE;
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
