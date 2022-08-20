import { ActorAlign, ContentGravity, Stage } from '@imports/clutter10';
import { File, FilePrototype } from '@imports/gio2';
import { Global } from '@imports/shell0';
import { BoxLayout, Label, TextureCache, ThemeContext } from '@imports/st1';
import { PanoItem } from '@pano/components/panoItem';
import { ClipboardContent, clipboardManager, ContentType } from '@pano/utils/clipboardManager';
import { DBItem } from '@pano/utils/db';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getCachePath, getCurrentExtension } from '@pano/utils/shell';

const global = Global.get();

const DEFAULT_LINK_PREVIEW_IMAGE_NAME = 'link-preview.png';

@registerGObjectClass
export class LinkPanoItem extends PanoItem {
  constructor(dbItem: DBItem) {
    super(dbItem);

    const { title, description, image } = JSON.parse(dbItem.metaData || '{"title": "", "description": ""}');

    this.body.add_style_class_name('pano-item-body-link');

    const metaContainer = new BoxLayout({
      style_class: 'pano-item-body-link-meta-container',
      vertical: true,
      x_expand: true,
      y_align: ActorAlign.END,
      x_align: ActorAlign.START,
    });

    const titleLabel = new Label({
      text: title ? decodeURI(title) : '',
      style_class: 'link-title-label',
    });

    const descriptionLabel = new Label({
      text: description ? decodeURI(description) : '',
      style_class: 'link-description-label',
    });
    descriptionLabel.clutter_text.single_line_mode = true;

    const linkLabel = new Label({
      text: this.dbItem.content,
      style_class: 'link-label',
    });

    const scaleFactor = ThemeContext.get_for_stage(global.stage as Stage).scale_factor;

    let imageFile: FilePrototype;
    if (image) {
      imageFile = File.new_for_path(`${getCachePath()}/${image}.png`);
      if (!imageFile.query_exists(null)) {
        imageFile = File.new_for_uri(`file:///${getCurrentExtension().path}/images/${DEFAULT_LINK_PREVIEW_IMAGE_NAME}`);
      }
    } else {
      imageFile = File.new_for_uri(`file:///${getCurrentExtension().path}/images/${DEFAULT_LINK_PREVIEW_IMAGE_NAME}`);
    }

    const imageContent = TextureCache.get_default().load_file_async(
      imageFile,
      -1,
      168,
      scaleFactor,
      this.body.get_resource_scale(),
    );
    imageContent.content_gravity = ContentGravity.RESIZE_ASPECT;

    this.body.add_child(imageContent);
    metaContainer.add_child(titleLabel);

    metaContainer.add_child(descriptionLabel);
    metaContainer.add_child(linkLabel);
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
