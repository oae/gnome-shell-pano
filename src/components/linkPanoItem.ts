import { ActorAlign, AlignAxis, AlignConstraint } from '@imports/clutter10';
import { File } from '@imports/gio2';
import { UriFlags, uri_parse } from '@imports/glib2';
import { BoxLayout, Label } from '@imports/st1';
import { PanoItem } from '@pano/components/panoItem';
import { ClipboardContent, clipboardManager, ContentType } from '@pano/utils/clipboardManager';
import { DBItem } from '@pano/utils/db';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getCachePath, getCurrentExtension } from '@pano/utils/shell';

const DEFAULT_LINK_PREVIEW_IMAGE_NAME = 'link-preview.png';

@registerGObjectClass
export class LinkPanoItem extends PanoItem {
  constructor(dbItem: DBItem) {
    super(dbItem);

    const { title, description, image } = JSON.parse(dbItem.metaData || '{"title": "", "description": ""}');
    let titleText: string = title;
    let descriptionText: string = description;

    if (!title) {
      titleText = uri_parse(dbItem.content, UriFlags.NONE).get_host() || this.dbItem.content;
    } else {
      titleText = decodeURI(title);
    }

    if (!description) {
      descriptionText = 'No Description';
    } else {
      descriptionText = decodeURI(description);
    }

    this.body.add_style_class_name('pano-item-body-link');

    const metaContainer = new BoxLayout({
      style_class: 'pano-item-body-meta-container',
      vertical: true,
      x_expand: true,
      y_expand: false,
      y_align: ActorAlign.END,
      x_align: ActorAlign.FILL,
    });

    const titleLabel = new Label({
      text: titleText,
      style_class: 'link-title-label',
    });

    const descriptionLabel = new Label({
      text: descriptionText,
      style_class: 'link-description-label',
    });
    descriptionLabel.clutter_text.single_line_mode = true;

    const linkLabel = new Label({
      text: this.dbItem.content,
      style_class: 'link-label',
    });

    let imageFilePath = `file:///${getCurrentExtension().path}/images/${DEFAULT_LINK_PREVIEW_IMAGE_NAME}`;
    if (image && File.new_for_uri(imageFilePath).query_exists(null)) {
      imageFilePath = `file://${getCachePath()}/${image}.png`;
    }

    const imageContainer = new BoxLayout({
      vertical: true,
      x_expand: true,
      y_expand: true,
      y_align: ActorAlign.FILL,
      x_align: ActorAlign.FILL,
      style: `background-image: url(${imageFilePath}); background-size: cover; margin-bottom: 15px`,
    });

    metaContainer.add_child(titleLabel);
    metaContainer.add_child(descriptionLabel);
    metaContainer.add_child(linkLabel);
    metaContainer.add_constraint(
      new AlignConstraint({
        source: this,
        align_axis: AlignAxis.Y_AXIS,
        factor: 0.001,
      }),
    );

    this.body.add_child(imageContainer);
    this.body.add_child(metaContainer);

    this.connect('activated', this.setClipboardContent.bind(this));
  }

  private setClipboardContent(): void {
    clipboardManager.setContent(
      new ClipboardContent({
        type: ContentType.TEXT,
        value: this.dbItem.content,
      }),
    );
  }
}
