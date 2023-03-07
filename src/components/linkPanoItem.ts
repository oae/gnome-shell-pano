import {
  ActorAlign,
  ButtonEvent,
  EVENT_PROPAGATE,
  KEY_ISO_Enter,
  KEY_KP_Enter,
  KEY_Return,
  KeyEvent,
  ModifierType,
} from '@gi-types/clutter10';
import { File, Settings } from '@gi-types/gio2';
import { uri_parse, UriFlags } from '@gi-types/glib2';
import { BoxLayout, Button, Icon, Label } from '@gi-types/st1';
import { PanoItem } from '@pano/components/panoItem';
import { ClipboardContent, clipboardManager, ContentType } from '@pano/utils/clipboardManager';
import { DBItem } from '@pano/utils/db';
import { registerGObjectClass } from '@pano/utils/gjs';
import { _, getCachePath, getCurrentExtension, openLinkInBrowser } from '@pano/utils/shell';

const DEFAULT_LINK_PREVIEW_IMAGE_NAME = 'link-preview.svg';

@registerGObjectClass
export class LinkPanoItem extends PanoItem {
  private linkItemSettings: Settings;
  private metaContainer: BoxLayout;
  private titleLabel: Label;
  private descriptionLabel: Label;
  private linkLabel: Label;

  constructor(dbItem: DBItem) {
    super(dbItem);

    this.linkItemSettings = this.settings.get_child('link-item');

    const { title, description, image } = JSON.parse(dbItem.metaData || '{"title": "", "description": ""}');
    let titleText: string = title;
    let descriptionText: string = description;

    if (!title) {
      titleText = uri_parse(dbItem.content, UriFlags.NONE).get_host() || this.dbItem.content;
    } else {
      titleText = decodeURI(title);
    }

    if (!description) {
      descriptionText = _('No Description');
    } else {
      descriptionText = decodeURI(description);
    }

    this.body.add_style_class_name('pano-item-body-link');

    this.metaContainer = new BoxLayout({
      style_class: 'pano-item-body-meta-container',
      vertical: true,
      x_expand: true,
      y_expand: false,
      y_align: ActorAlign.END,
      x_align: ActorAlign.FILL,
    });

    this.titleLabel = new Label({
      text: titleText,
      style_class: 'link-title-label',
    });

    this.descriptionLabel = new Label({
      text: descriptionText,
      style_class: 'link-description-label',
    });
    this.descriptionLabel.clutter_text.single_line_mode = true;

    this.linkLabel = new Label({
      text: this.dbItem.content,
      style_class: 'link-label',
    });

    let imageFilePath = `file:///${getCurrentExtension().path}/images/${DEFAULT_LINK_PREVIEW_IMAGE_NAME}`;
    if (image && File.new_for_uri(`file://${getCachePath()}/${image}.png`).query_exists(null)) {
      imageFilePath = `file://${getCachePath()}/${image}.png`;
    }

    const imageContainer = new BoxLayout({
      vertical: true,
      x_expand: true,
      y_expand: true,
      y_align: ActorAlign.FILL,
      x_align: ActorAlign.FILL,
      style_class: 'image-container',
      style: `background-image: url(${imageFilePath});`,
    });

    this.metaContainer.add_child(this.titleLabel);
    this.metaContainer.add_child(this.descriptionLabel);
    this.metaContainer.add_child(this.linkLabel);

    this.body.add_child(imageContainer);
    this.body.add_child(this.metaContainer);

    this.connect('activated', this.setClipboardContent.bind(this));
    this.setStyle();
    this.linkItemSettings.connect('changed', this.setStyle.bind(this));
  }

  private setStyle() {
    const headerBgColor = this.linkItemSettings.get_string('header-bg-color');
    const headerColor = this.linkItemSettings.get_string('header-color');
    const bodyBgColor = this.linkItemSettings.get_string('body-bg-color');
    const metadataBgColor = this.linkItemSettings.get_string('metadata-bg-color');
    const metadataTitleColor = this.linkItemSettings.get_string('metadata-title-color');
    const metadataDescriptionColor = this.linkItemSettings.get_string('metadata-description-color');
    const metadataLinkColor = this.linkItemSettings.get_string('metadata-link-color');
    const metadataTitleFontFamily = this.linkItemSettings.get_string('metadata-title-font-family');
    const metadataDescriptionFontFamily = this.linkItemSettings.get_string('metadata-description-font-family');
    const metadataLinkFontFamily = this.linkItemSettings.get_string('metadata-link-font-family');
    const metadataTitleFontSize = this.linkItemSettings.get_int('metadata-title-font-size');
    const metadataDescriptionFontSize = this.linkItemSettings.get_int('metadata-description-font-size');
    const metadataLinkFontSize = this.linkItemSettings.get_int('metadata-link-font-size');

    this.header.set_style(`background-color: ${headerBgColor}; color: ${headerColor};`);
    this.body.set_style(`background-color: ${bodyBgColor};`);
    this.metaContainer.set_style(`background-color: ${metadataBgColor};`);
    this.titleLabel.set_style(
      `color: ${metadataTitleColor}; font-family: ${metadataTitleFontFamily}; font-size: ${metadataTitleFontSize}px;`,
    );
    this.descriptionLabel.set_style(
      `color: ${metadataDescriptionColor}; font-family: ${metadataDescriptionFontFamily}; font-size: ${metadataDescriptionFontSize}px;`,
    );
    this.linkLabel.set_style(
      `color: ${metadataLinkColor}; font-family: ${metadataLinkFontFamily}; font-size: ${metadataLinkFontSize}px;`,
    );

    const openLinkIcon = new Icon({
      icon_name: 'web-browser-symbolic',
      style_class: 'pano-item-action-button-icon',
    });

    const openLinkButton = new Button({
      style_class: 'pano-item-action-button pano-item-open-link-button',
      child: openLinkIcon,
    });

    openLinkButton.connect('clicked', () => {
      openLinkInBrowser(this.dbItem.content);
      return EVENT_PROPAGATE;
    });

    this.header.actionContainer.insert_child_at_index(openLinkButton, 0);
  }

  private setClipboardContent(): void {
    clipboardManager.setContent(
      new ClipboardContent({
        type: ContentType.TEXT,
        value: this.dbItem.content,
      }),
    );
  }

  override vfunc_key_press_event(event: KeyEvent): boolean {
    super.vfunc_key_press_event(event);
    if (
      this.settings.get_boolean('open-links-in-browser') &&
      event.modifier_state === ModifierType.CONTROL_MASK &&
      (event.keyval === KEY_Return || event.keyval === KEY_ISO_Enter || event.keyval === KEY_KP_Enter)
    ) {
      openLinkInBrowser(this.dbItem.content);
    }

    return EVENT_PROPAGATE;
  }

  override vfunc_button_release_event(event: ButtonEvent): boolean {
    super.vfunc_button_release_event(event);
    if (
      event.button === 1 &&
      event.modifier_state === ModifierType.CONTROL_MASK &&
      this.settings.get_boolean('open-links-in-browser')
    ) {
      openLinkInBrowser(this.dbItem.content);
    }

    return EVENT_PROPAGATE;
  }
}
