import { Config, Connection, SqlBuilder, SqlStatementType } from '@imports/gda5';
import { ChecksumType, compute_checksum_for_bytes } from '@imports/glib2';
import { FileOperationValue } from '@pano/utils/clipboardManager';
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
          itemType    text not null,
          content     text,
          copyDate    text not null
      );
    `);

    this.connection.execute_non_select_command(`
      create unique index if not exists clipboard_id_uindex on clipboard (id);
    `);
  }

  save(itemType: string, content: string | Uint8Array | FileOperationValue, date: Date): number | null {
    if (!this.connection || !this.connection.is_opened()) {
      debug('connection is not opened');
      return null;
    }

    const builder = new SqlBuilder({
      stmt_type: SqlStatementType.INSERT,
    });

    builder.set_table('clipboard');
    builder.add_field_value_as_gvalue('itemType', itemType as any);
    builder.add_field_value_as_gvalue('copyDate', date.toISOString() as any);
    if (content instanceof Uint8Array) {
      builder.add_field_value_as_gvalue('content', compute_checksum_for_bytes(ChecksumType.MD5, content) as any);
    } else if (typeof content === 'object' && 'operation' in content && 'fileList' in content) {
      builder.add_field_value_as_gvalue('content', JSON.stringify(content) as any);
    } else {
      builder.add_field_value_as_gvalue('content', content as any);
    }
    const [_, row] = this.connection.statement_execute_non_select(builder.get_statement(), null);

    return (row?.get_nth_holder(0).get_value() as any as number) || null;
  }

  query(): any[] {
    if (!this.connection || !this.connection.is_opened()) {
      return [];
    }

    const dm = this.connection.execute_select_command('select * from clipboard order by copyDate asc');

    const iter = dm.create_iter();
    const itemList: any[] = [];

    while (iter.move_next()) {
      const id = iter.get_value_for_field('id') as any as number;
      const itemType = iter.get_value_for_field('itemType') as any as string;
      const content = iter.get_value_for_field('content') as any as string;
      const copyDate = iter.get_value_for_field('copyDate') as any as string;

      if (!content || !itemType || !copyDate || !id) {
        continue;
      }

      itemList.push([id, itemType, content, copyDate]);
    }

    return itemList;
  }

  shutdown() {
    if (this.connection && this.connection.is_opened()) {
      this.connection.close();
    }
  }
}

export const db = new Database();
