import { ActorAlign } from '@gi-types/clutter10';
import { EllipsizeMode } from '@gi-types/pango1';
import { BoxLayout, Icon, Label } from '@gi-types/st1';
import { PanoItem } from '@pano/components/panoItem';
import { ClipboardContent, clipboardManager, ContentType, FileOperation } from '@pano/utils/clipboardManager';
import { DBItem } from '@pano/utils/db';
import { registerGObjectClass } from '@pano/utils/gjs';

@registerGObjectClass
export class FilePanoItem extends PanoItem {
  private fileList: string[];
  private operation: string;

  constructor(dbItem: DBItem) {
    super(dbItem);

    this.fileList = JSON.parse(this.dbItem.content);
    this.operation = this.dbItem.metaData || 'copy';

    this.body.add_style_class_name('pano-item-body-file');

    const container = new BoxLayout({
      style_class: 'copied-files-container',
      vertical: true,
      x_expand: true,
      clip_to_allocation: true,
    });

    this.fileList
      .map((f) => {
        const items = f.split('://').filter((c) => !!c);
        return decodeURIComponent(items[items.length - 1]);
      })
      .slice(0, 11)
      .forEach((uri, index) => {
        const bl = new BoxLayout({
          vertical: false,
          style_class: `copied-file-name ${index % 2 === 0 ? 'even' : 'odd'}`,
          x_expand: true,
          x_align: ActorAlign.FILL,
          clip_to_allocation: true,
          y_align: ActorAlign.FILL,
        });
        bl.add_child(
          new Icon({
            icon_name: this.operation === FileOperation.CUT ? 'edit-cut-symbolic' : 'edit-copy-symbolic',
            x_align: ActorAlign.START,
            icon_size: 14,
            style_class: 'file-icon',
          }),
        );

        const hasMore = index === 10 && this.fileList.length > 11;

        const uriLabel = new Label({
          text: hasMore ? `...and ${this.fileList.length - index} more` : uri,
          style_class: `pano-item-body-file-name-label ${hasMore ? 'has-more' : ''}`,
          x_align: ActorAlign.FILL,
          x_expand: true,
        });
        uriLabel.clutter_text.ellipsize = EllipsizeMode.START;
        bl.add_child(uriLabel);
        container.add_child(bl);
      });

    this.body.add_child(container);
    this.connect('activated', this.setClipboardContent.bind(this));
  }

  private setClipboardContent(): void {
    clipboardManager.setContent(
      new ClipboardContent({
        type: ContentType.FILE,
        value: { fileList: this.fileList, operation: this.operation },
      }),
    );
  }
}
