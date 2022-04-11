import { ActorAlign, ContentGravity, Stage } from '@imports/clutter10';
import { File } from '@imports/gio2';
import { PRIORITY_DEFAULT } from '@imports/glib2';
import { Global } from '@imports/shell0';
import { Message, Session } from '@imports/soup3';
import { BoxLayout, Icon, Label, TextureCache, ThemeContext } from '@imports/st1';
import { registerGObjectClass } from '@pano/utils/gjs';
import { PanoItemTypes } from '@pano/utils/panoItemType';
import { XMLParser } from 'fast-xml-parser';
import { PanoItem } from './panoItem';

const global = Global.get();

@registerGObjectClass
export class LinkPanoItem extends PanoItem {
  constructor(content: string, date: Date) {
    super(PanoItemTypes.LINK, date);
    this.body.style_class = 'pano-item-body pano-item-body-link';
    this.readOgData(content);
  }

  async readOgData(url: string): Promise<void> {
    const session = new Session();
    let message = Message.new('GET', url);
    let response = await session.send_and_read_async(message, PRIORITY_DEFAULT, null);
    const decoder = new TextDecoder();
    if (response == null) {
      return;
    }

    let bytes = response.get_data();

    if (bytes == null) {
      return;
    }

    const body = decoder.decode(bytes);
    const parser = new XMLParser({
      ignoreAttributes: false,
      unpairedTags: ['hr', 'br', 'link', 'meta'],
      stopNodes: ['*.pre', '*.script', '*.html.body'],
      processEntities: true,
      htmlEntities: true,
    });
    try {
      const parsed = parser.parse(body);

      const metaList = [
        ...(parsed.html?.head?.body?.['ytd-app']?.meta || []),
        ...(parsed.html?.head?.meta || []),
        ...(parsed['!doctype']?.html?.head?.meta || []),
      ];

      const backupTitle =
        parsed.html?.head?.body?.['ytd-app']?.title ||
        parsed.html?.head?.title ||
        parsed['!doctype']?.html?.head?.title;

      let description = metaList.find((i: any) => i['@_property'] === 'og:description');
      if (description) {
        description = description['@_content'];
      }
      let title = metaList.find((i: any) => i['@_property'] === 'og:title');
      if (title) {
        title = title['@_content'];
      }
      let host = metaList.find((i: any) => i['@_property'] === 'og:url');
      if (host) {
        host = host['@_content'];
      }
      let image = metaList.find((i: any) => i['@_property'] === 'og:image');
      if (image) {
        image = image['@_content'];
      }

      if (!title) {
        title = backupTitle || url;
      }
      if (!description) {
        description = title;
      }
      if (!host) {
        host = url;
      }
      if (!image || !image.startsWith('http')) {
        image = 'https://i.imgur.com/gCDsBYk.png';
      }

      message = Message.new('GET', image);

      try {
        response = await session.send_and_read_async(message, PRIORITY_DEFAULT, null);

        if (response == null) {
          this.body.add_child(
            new Icon({
              icon_name: 'earth-symbolic',
              style: 'color: #000',
              x_expand: true,
              y_expand: true,
            }),
          );
        } else {
          bytes = response.get_data();
          if (!bytes) {
            this.body.add_child(
              new Icon({
                icon_name: 'earth-symbolic',
                style: 'color: #000',
                x_expand: true,
                y_expand: true,
              }),
            );
          } else {
            const scaleFactor = ThemeContext.get_for_stage(global.stage as Stage).scale_factor;
            const [file, ioStream] = File.new_tmp('XXXXXX.png');
            ioStream.output_stream.write_bytes(bytes, null);
            ioStream.close(null);
            const actor = TextureCache.get_default().load_file_async(
              file,
              -1,
              168,
              scaleFactor,
              this.body.get_resource_scale(),
            );
            if (actor) {
              actor.content_gravity = ContentGravity.RESIZE_ASPECT;
              this.body.add_child(actor);
            }
          }
        }
      } catch (err) {
        log(err);
        this.body.add_child(
          new Icon({
            icon_name: 'earth-symbolic',
            style: 'color: #000',
            x_expand: true,
            y_expand: true,
          }),
        );
      }
      const urlMetaContainer = new BoxLayout({
        style: 'padding: 0px, 12px, 12px, 12px',
        vertical: true,
        x_expand: true,
        y_align: ActorAlign.END,
        x_align: ActorAlign.START,
      });

      this.body.add_child(urlMetaContainer);

      urlMetaContainer.add_child(
        new Label({
          text: title,
          style: 'font-size: 13px; color: #000; font-weight: bold;',
        }),
      );
      const descriptionLabel = new Label({
        text: description,
        style: 'font-size: 12px; color: #000',
      });
      descriptionLabel.clutter_text.single_line_mode = true;
      urlMetaContainer.add_child(descriptionLabel);
      urlMetaContainer.add_child(
        new Label({
          text: host,
          style: 'margin-top: 5px; font-size: 10px; color: #2c2f44',
        }),
      );
    } catch (err) {
      log(err);
    }
  }
}
