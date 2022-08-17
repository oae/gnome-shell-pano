import { Actor, ActorAlign, ContentGravity, Stage } from '@imports/clutter10';
import { File, FilePrototype } from '@imports/gio2';
import { Global } from '@imports/shell0';
import { BoxLayout, Label, TextureCache, ThemeContext } from '@imports/st1';
import { PanoItem } from '@pano/components/panoItem';
import { ClipboardContent, clipboardManager, ContentType } from '@pano/utils/clipboardManager';
import { ClipboardQueryBuilder, db } from '@pano/utils/db';
import { registerGObjectClass } from '@pano/utils/gjs';
import { getDescription, getDocument, getImage, getMetaList, getTitle } from '@pano/utils/linkParser';
import { PanoItemTypes } from '@pano/utils/panoItemType';
import { getCachePath, getCurrentExtension } from '@pano/utils/shell';

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

  constructor(id: number | null, content: string, date: Date) {
    super(id, PanoItemTypes.LINK, date);
    this.body.style_class = [this.body.style_class, 'pano-item-body-link'].join(' ');
    this.link = content;

    this.metaContainer = new BoxLayout({
      style_class: 'pano-item-body-link-meta-container',
      vertical: true,
      x_expand: true,
      y_align: ActorAlign.END,
      x_align: ActorAlign.START,
    });

    this.titleLabel = new Label({
      text: 'Loading...',
      style_class: 'link-title-label',
    });

    this.descriptionLabel = new Label({
      text: 'Loading...',
      style_class: 'link-description-label',
    });
    this.descriptionLabel.clutter_text.single_line_mode = true;

    this.linkLabel = new Label({
      text: this.link,
      style_class: 'link-label',
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

    this.metaContainer.add_child(this.descriptionLabel);
    this.metaContainer.add_child(this.linkLabel);
    this.body.add_child(this.metaContainer);

    if (!this.dbId) {
      // const savedItem = db.save('LINK', this.link, date);
      const savedItem = db.save({
        content: this.link,
        copyDate: date,
        isFavorite: false,
        itemType: 'LINK',
        matchValue: this.link,
      });
      if (savedItem) {
        this.dbId = savedItem.id;
      }
    }
    this.readLinkMetaData();
    this.connect('activated', this.setClipboardContent.bind(this));
  }

  private hideMissing() {
    this.titleLabel.text = this.link;
    this.descriptionLabel.hide();
    this.linkLabel.hide();
  }

  async readLinkMetaData(): Promise<void> {
    if (this.dbId === null) {
      this.hideMissing();
      return;
    }

    const result = db.query(new ClipboardQueryBuilder().withId(this.dbId).build());

    if (result.length === 0) {
      this.hideMissing();
      return;
    }

    const linkDbItem = result[0];
    let title: string, description: string, image: FilePrototype;
    if (linkDbItem.metaData) {
      const metaData = JSON.parse(linkDbItem.metaData);
      title = decodeURI(metaData.title);
      description = decodeURI(metaData.description);
      const cachedImage = File.new_for_path(`${getCachePath()}/${metaData.image}.png`);

      if (cachedImage.query_exists(null)) {
        image = cachedImage;
      } else {
        image = File.new_for_uri(`file:///${getCurrentExtension().path}/images/${DEFAULT_LINK_PREVIEW_IMAGE_NAME}`);
      }
    } else {
      const doc = await getDocument(this.link);

      if (!doc) {
        this.hideMissing();
        return;
      }

      const metaList = getMetaList(doc);

      title = getTitle(doc, metaList) || this.link;
      description = getDescription(metaList) || title;
      const [checksum, linkImage] = await getImage(metaList);
      if (!linkImage) {
        image = File.new_for_uri(`file:///${getCurrentExtension().path}/images/${DEFAULT_LINK_PREVIEW_IMAGE_NAME}`);
      } else {
        image = linkImage;
      }

      db.update({
        id: this.dbId,
        content: linkDbItem.content,
        copyDate: linkDbItem.copyDate,
        isFavorite: linkDbItem.isFavorite,
        itemType: linkDbItem.itemType,
        matchValue: linkDbItem.content,
        searchValue: `${title}${description}${linkDbItem.content}`,
        metaData: JSON.stringify({
          title: encodeURI(title),
          description: encodeURI(description),
          image: checksum,
        }),
      });
    }

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

  private setClipboardContent(): void {
    clipboardManager.setContent(
      new ClipboardContent({
        type: ContentType.TEXT,
        value: this.link,
      }),
    );
  }
}
