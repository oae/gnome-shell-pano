import { Actor, ActorAlign, ContentGravity, Stage } from '@imports/clutter10';
import { File } from '@imports/gio2';
import { Global } from '@imports/shell0';
import { BoxLayout, Label, TextureCache, ThemeContext } from '@imports/st1';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getDescription, getDocument, getImage, getMetaList, getTitle } from '@pano/utils/linkParser';
import { PanoItemTypes } from '@pano/utils/panoItemType';
import { getCurrentExtension } from '@pano/utils/shell';
import { PanoItem } from './panoItem';

const global = Global.get();

const DEFAULT_LINK_PREVIEW_IMAGE_NAME = 'link-preview.png';

@registerGObjectClass
export class LinkPanoItem extends PanoItem {
  private link: string;
  private metaContainer: BoxLayout;
  private imageContent: Actor;
  private titleLabel: Label;
  private descriptionLabel: Label;
  private linkLabel: Label;

  constructor(content: string, date: Date) {
    super(PanoItemTypes.LINK, date);
    this.body.style_class = 'pano-item-body pano-item-body-link';
    this.link = content;
    this.metaContainer = new BoxLayout({
      style: 'padding: 0px, 12px, 12px, 12px',
      vertical: true,
      x_expand: true,
      y_align: ActorAlign.END,
      x_align: ActorAlign.START,
    });

    const isHttpLink = this.link.startsWith('http');

    this.titleLabel = new Label({
      text: isHttpLink ? 'Loading...' : this.link,
      style: 'font-size: 13px; color: #000; font-weight: bold;',
    });

    this.descriptionLabel = new Label({
      text: isHttpLink ? 'Loading...' : this.link,
      style: 'font-size: 12px; color: #000',
    });
    this.descriptionLabel.clutter_text.single_line_mode = true;

    this.linkLabel = new Label({
      text: this.link,
      style: 'margin-top: 5px; font-size: 10px; color: #2c2f44',
    });

    const scaleFactor = ThemeContext.get_for_stage(global.stage as Stage).scale_factor;
    const uri = `file:///${getCurrentExtension().path}/images/${DEFAULT_LINK_PREVIEW_IMAGE_NAME}`;
    this.imageContent = TextureCache.get_default().load_file_async(
      File.new_for_uri(uri),
      -1,
      168,
      scaleFactor,
      this.body.get_resource_scale(),
    );
    this.imageContent.content_gravity = ContentGravity.RESIZE_ASPECT;

    this.body.add_child(this.imageContent);
    this.metaContainer.add_child(this.titleLabel);

    if (isHttpLink) {
      this.metaContainer.add_child(this.descriptionLabel);
      this.metaContainer.add_child(this.linkLabel);
      this.readLinkMetaData();
    }

    this.body.add_child(this.metaContainer);
  }

  async readLinkMetaData(): Promise<void> {
    const doc = await getDocument(this.link);

    if (!doc) {
      this.titleLabel.text = this.link;
      this.descriptionLabel.hide();
      this.linkLabel.hide();
      return;
    }

    const metaList = getMetaList(doc);

    const title = getTitle(doc, metaList) || this.link;
    const description = getDescription(metaList) || title;
    const image = await getImage(metaList);

    this.titleLabel.text = title;
    this.descriptionLabel.text = description;

    if (image) {
      const scaleFactor = ThemeContext.get_for_stage(global.stage as Stage).scale_factor;
      this.body.remove_actor(this.imageContent);
      this.imageContent = TextureCache.get_default().load_file_async(
        image,
        -1,
        168,
        scaleFactor,
        this.body.get_resource_scale(),
      );
      this.imageContent.content_gravity = ContentGravity.RESIZE_ASPECT;
      this.body.insert_child_at_index(this.imageContent, 0);
    }
  }
}
