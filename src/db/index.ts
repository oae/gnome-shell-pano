import { Config, Connection, SqlBuilder, SqlStatementType } from '@imports/gda5';
import { ContentType } from '@pano/utils/clipboardManager';
import { getCurrentExtension, logger } from '@pano/utils/shell';

const debug = logger('database');

class Database {
  private connection: Connection;

  setup() {
    this.connection = new Connection({
      provider: Config.get_provider('SQLite'),
      cnc_string: `DB_DIR=${getCurrentExtension().path};DB_NAME=pano`,
    });
    this.connection.open();
    this.connection.execute_non_select_command(`
      create table if not exists clipboard
      (
          id          integer not null constraint clipboard_pk primary key autoincrement,
          itemType    integer not null,
          content     text,
          contentBin  BLOB,
          copyDate    TEXT not null
      );
    `);

    this.connection.execute_non_select_command(`
      create unique index if not exists clipboard_id_uindex on clipboard (id);
    `);
  }

  save(itemType: ContentType, content: string | Uint8Array | string[], date: Date) {
    if (!this.connection || !this.connection.is_opened()) {
      debug('connection is not opened');
      return;
    }

    const builder = new SqlBuilder({
      stmt_type: SqlStatementType.INSERT,
    });

    builder.set_table('clipboard');
    builder.add_field_value_as_gvalue('itemType', itemType as any);
    builder.add_field_value_as_gvalue('copyDate', date.toISOString() as any);
    if (content instanceof Uint8Array) {
      builder.add_field_value_as_gvalue('contentBin', content as any);
    } else if (Array.isArray(content)) {
      builder.add_field_value_as_gvalue('content', JSON.stringify(content) as any);
    } else {
      builder.add_field_value_as_gvalue('content', content as any);
    }
    this.connection.statement_execute_non_select(builder.get_statement(), null);
  }

  shutdown() {
    if (this.connection && this.connection.is_opened()) {
      this.connection.close();
    }
  }
}

export const db = new Database();
