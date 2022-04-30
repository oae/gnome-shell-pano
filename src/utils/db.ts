import { Config, Connection, SqlBuilder, SqlOperatorType, SqlStatementType } from '@imports/gda5';
import { ChecksumType, compute_checksum_for_bytes } from '@imports/glib2';
import { FileOperationValue } from '@pano/utils/clipboardManager';
import { getCurrentExtension, logger } from '@pano/utils/shell';

const debug = logger('database');

type DBItem = {
  id: number;
  itemType: string;
  content: string;
  copyDate: Date;
};

class Database {
  private connection: Connection | null;

  private init() {
    this.connection = new Connection({
      provider: Config.get_provider('SQLite'),
      cnc_string: `DB_DIR=${getCurrentExtension().path};DB_NAME=pano`,
    });
    this.connection.open();
  }

  setup() {
    this.init();
    if (!this.connection || !this.connection.is_opened()) {
      debug('connection is not opened');
      return;
    }

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

  save(itemType: string, content: string, copyDate: Date): DBItem | null {
    if (!this.connection || !this.connection.is_opened()) {
      debug('connection is not opened');
      return null;
    }

    const builder = new SqlBuilder({
      stmt_type: SqlStatementType.INSERT,
    });

    builder.set_table('clipboard');
    builder.add_field_value_as_gvalue('itemType', itemType as any);
    builder.add_field_value_as_gvalue('copyDate', copyDate.toISOString() as any);
    builder.add_field_value_as_gvalue('content', content as any);
    const [_, row] = this.connection.statement_execute_non_select(builder.get_statement(), null);
    const id = row?.get_nth_holder(0).get_value() as any as number;
    if (!id) {
      return null;
    }
    return {
      id,
      itemType,
      content,
      copyDate,
    };
  }

  search(content: string): number[] {
    const result: number[] = [];
    if (!this.connection || !this.connection.is_opened()) {
      debug('connection is not opened');
      return result;
    }

    const builder = new SqlBuilder({
      stmt_type: SqlStatementType.SELECT,
    });

    builder.select_add_field('id', 'clipboard', 'id');

    const contentField = builder.add_field_id('content', 'clipboard');
    const contentValue = builder.add_expr_value(null, `%${content}%` as any);
    const contentCond = builder.add_cond(SqlOperatorType.LIKE, contentField, contentValue, 0);
    //TODO: add order by for date

    const itemTypeField = builder.add_field_id('itemType', 'clipboard');

    const itemTypeValue = builder.add_expr_value(null, 'IMAGE' as any);
    const itemTypeCond = builder.add_cond(SqlOperatorType.NOTIN, itemTypeField, itemTypeValue, 0);

    builder.select_add_target('clipboard', null);

    const cond = builder.add_cond(SqlOperatorType.AND, contentCond, itemTypeCond, 0);
    builder.set_where(cond);

    // debug(`${builder.get_statement().to_sql_extended(this.connection, null, StatementSqlFlag.PRETTY)}`);

    const dm = this.connection.statement_execute_select(builder.get_statement(), null);
    if (!dm) {
      return result;
    }

    const iter = dm.create_iter();

    while (iter.move_next()) {
      const id = iter.get_value_for_field('id') as any as number;

      if (!id) {
        continue;
      }

      result.push(id);
    }

    return result;
  }

  find(itemType: string, content: string | Uint8Array | FileOperationValue): number | null {
    if (!this.connection || !this.connection.is_opened()) {
      debug('connection is not opened');
      return null;
    }

    let condition = content;
    if (content instanceof Uint8Array) {
      const checksum = compute_checksum_for_bytes(ChecksumType.MD5, content);
      if (checksum) {
        condition = checksum;
      }
    } else if (content && typeof content === 'object' && 'operation' in content && 'fileList' in content) {
      condition = JSON.stringify(content);
    }
    const builder = new SqlBuilder({
      stmt_type: SqlStatementType.SELECT,
    });

    builder.select_add_field('id', 'clipboard', 'id');

    const contentField = builder.add_field_id('content', 'clipboard');
    const contentValue = builder.add_expr_value(null, condition as any);
    const contentCond = builder.add_cond(SqlOperatorType.EQ, contentField, contentValue, 0);

    const itemTypeField = builder.add_field_id('itemType', 'clipboard');
    const itemTypeValue = builder.add_expr_value(null, itemType as any);
    const itemTypeCond = builder.add_cond(SqlOperatorType.EQ, itemTypeField, itemTypeValue, 0);

    builder.select_add_target('clipboard', null);

    const cond = builder.add_cond(SqlOperatorType.AND, contentCond, itemTypeCond, 0);
    builder.set_where(cond);

    // debug(`${builder.get_statement().to_sql_extended(this.connection, null, StatementSqlFlag.PRETTY)}`);

    const dm = this.connection.statement_execute_select(builder.get_statement(), null);
    if (!dm) {
      return null;
    }

    const iter = dm.create_iter();

    while (iter.move_next()) {
      const id = iter.get_value_for_field('id') as any as number;

      if (!id) {
        continue;
      }

      return id;
    }

    return null;
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

      itemList.push({ id, itemType, content, copyDate });
    }

    return itemList;
  }

  start() {
    if (!this.connection) {
      this.init();
    }

    if (this.connection && !this.connection.is_opened()) {
      this.connection.open();
    }
  }

  shutdown() {
    if (this.connection && this.connection.is_opened()) {
      this.connection.close();
      this.connection = null;
    }
  }
}

export const db = new Database();
