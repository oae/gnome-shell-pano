import {
  Config,
  Connection,
  SqlBuilder,
  SqlOperatorType,
  SqlStatementType,
  Statement,
  StatementSqlFlag,
} from '@imports/gda5';
import { getAppDataPath, logger } from '@pano/utils/shell';

const debug = logger('database');

export type DBItem = {
  id: number;
  itemType: string;
  content: string;
  copyDate: Date;
  isFavorite: boolean;
  matchValue: string;
  searchValue?: string;
  metaData?: string;
};

class ClipboardQuery {
  readonly statement: Statement;

  constructor(statement: Statement) {
    this.statement = statement;
  }
}

export class ClipboardQueryBuilder {
  private readonly builder: SqlBuilder;
  private conditions: number[];

  constructor() {
    this.conditions = [];
    this.builder = new SqlBuilder({
      stmt_type: SqlStatementType.SELECT,
    });
    this.builder.select_add_field('id', 'clipboard', 'id');
    this.builder.select_add_field('itemType', 'clipboard', 'itemType');
    this.builder.select_add_field('content', 'clipboard', 'content');
    this.builder.select_add_field('copyDate', 'clipboard', 'copyDate');
    this.builder.select_add_field('isFavorite', 'clipboard', 'isFavorite');
    this.builder.select_add_field('matchValue', 'clipboard', 'matchValue');
    this.builder.select_add_field('searchValue', 'clipboard', 'searchValue');
    this.builder.select_add_field('metaData', 'clipboard', 'metaData');

    this.builder.select_add_target('clipboard', null);
  }

  withId(id?: number | null) {
    if (id !== null && id !== undefined) {
      this.conditions.push(
        this.builder.add_cond(
          SqlOperatorType.EQ,
          this.builder.add_field_id('id', 'clipboard'),
          this.builder.add_expr_value(null, id as any),
          0,
        ),
      );
    }

    return this;
  }

  withItemTypes(itemTypes?: string[] | null) {
    if (itemTypes !== null && itemTypes !== undefined) {
      const orConditions = itemTypes.map((itemType) =>
        this.builder.add_cond(
          SqlOperatorType.EQ,
          this.builder.add_field_id('itemType', 'clipboard'),
          this.builder.add_expr_value(null, itemType as any),
          0,
        ),
      );
      this.conditions.push(this.builder.add_cond_v(SqlOperatorType.OR, orConditions));
    }

    return this;
  }

  withContent(content?: string | null) {
    if (content !== null && content !== undefined) {
      this.conditions.push(
        this.builder.add_cond(
          SqlOperatorType.EQ,
          this.builder.add_field_id('content', 'clipboard'),
          this.builder.add_expr_value(null, content as any),
          0,
        ),
      );
    }

    return this;
  }

  withMatchValue(matchValue?: string | null) {
    if (matchValue !== null && matchValue !== undefined) {
      this.conditions.push(
        this.builder.add_cond(
          SqlOperatorType.EQ,
          this.builder.add_field_id('matchValue', 'clipboard'),
          this.builder.add_expr_value(null, matchValue as any),
          0,
        ),
      );
    }

    return this;
  }

  withContainingContent(content?: string | null) {
    if (content !== null && content !== undefined) {
      this.conditions.push(
        this.builder.add_cond(
          SqlOperatorType.LIKE,
          this.builder.add_field_id('content', 'clipboard'),
          this.builder.add_expr_value(null, `%${content}%` as any),
          0,
        ),
      );
    }

    return this;
  }

  withContainingSearchValue(searchValue?: string | null) {
    if (searchValue !== null && searchValue !== undefined) {
      this.conditions.push(
        this.builder.add_cond(
          SqlOperatorType.LIKE,
          this.builder.add_field_id('searchValue', 'clipboard'),
          this.builder.add_expr_value(null, `%${searchValue}%` as any),
          0,
        ),
      );
    }

    return this;
  }

  build(): ClipboardQuery {
    if (this.conditions.length > 0) {
      this.builder.set_where(this.builder.add_cond_v(SqlOperatorType.AND, this.conditions));
    }

    return new ClipboardQuery(this.builder.get_statement());
  }
}
class Database {
  private connection: Connection | null;

  private init() {
    this.connection = new Connection({
      provider: Config.get_provider('SQLite'),
      cnc_string: `DB_DIR=${getAppDataPath()};DB_NAME=pano`,
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
          content     text not null,
          copyDate    text not null,
          isFavorite  integer not null,
          matchValue  text not null,
          searchValue text,
          metaData    text
      );
    `);

    this.connection.execute_non_select_command(`
      create unique index if not exists clipboard_id_uindex on clipboard (id);
    `);
  }

  save(dbItem: Omit<DBItem, 'id'>): DBItem | null {
    if (!this.connection || !this.connection.is_opened()) {
      debug('connection is not opened');
      return null;
    }

    const builder = new SqlBuilder({
      stmt_type: SqlStatementType.INSERT,
    });

    builder.set_table('clipboard');
    builder.add_field_value_as_gvalue('itemType', dbItem.itemType as any);
    builder.add_field_value_as_gvalue('content', dbItem.content as any);
    builder.add_field_value_as_gvalue('copyDate', dbItem.copyDate.toISOString() as any);
    builder.add_field_value_as_gvalue('isFavorite', +dbItem.isFavorite as any);
    builder.add_field_value_as_gvalue('matchValue', dbItem.matchValue as any);
    if (dbItem.searchValue) {
      builder.add_field_value_as_gvalue('searchValue', dbItem.searchValue as any);
    }
    if (dbItem.metaData) {
      builder.add_field_value_as_gvalue('metaData', dbItem.metaData as any);
    }
    const [_, row] = this.connection.statement_execute_non_select(builder.get_statement(), null);
    const id = row?.get_nth_holder(0).get_value() as any as number;
    if (!id) {
      return null;
    }
    return {
      id,
      itemType: dbItem.itemType,
      content: dbItem.content,
      copyDate: dbItem.copyDate,
      isFavorite: dbItem.isFavorite,
      matchValue: dbItem.matchValue,
      searchValue: dbItem.searchValue,
      metaData: dbItem.metaData,
    };
  }

  update(dbItem: DBItem): void {
    if (!this.connection || !this.connection.is_opened()) {
      debug('connection is not opened');
      return;
    }

    const builder = new SqlBuilder({
      stmt_type: SqlStatementType.UPDATE,
    });

    builder.set_table('clipboard');
    builder.add_field_value_as_gvalue('itemType', dbItem.itemType as any);
    builder.add_field_value_as_gvalue('content', dbItem.content as any);
    builder.add_field_value_as_gvalue('copyDate', dbItem.copyDate.toISOString() as any);
    builder.add_field_value_as_gvalue('isFavorite', +dbItem.isFavorite as any);
    builder.add_field_value_as_gvalue('matchValue', dbItem.matchValue as any);
    if (dbItem.searchValue) {
      builder.add_field_value_as_gvalue('searchValue', dbItem.searchValue as any);
    }
    if (dbItem.metaData) {
      builder.add_field_value_as_gvalue('metaData', dbItem.metaData as any);
    }
    builder.set_where(
      builder.add_cond(
        SqlOperatorType.EQ,
        builder.add_field_id('id', 'clipboard'),
        builder.add_expr_value(null, dbItem.id as any),
        0,
      ),
    );
    this.connection.statement_execute_non_select(builder.get_statement(), null);
  }

  delete(id: number): void {
    if (!this.connection || !this.connection.is_opened()) {
      debug('connection is not opened');
      return;
    }

    const builder = new SqlBuilder({
      stmt_type: SqlStatementType.DELETE,
    });

    builder.set_table('clipboard');
    builder.set_where(
      builder.add_cond(
        SqlOperatorType.EQ,
        builder.add_field_id('id', 'clipboard'),
        builder.add_expr_value(null, id as any),
        0,
      ),
    );
    this.connection.statement_execute_non_select(builder.get_statement(), null);
  }

  query(clipboardQuery: ClipboardQuery): DBItem[] {
    if (!this.connection || !this.connection.is_opened()) {
      return [];
    }

    debug(`${clipboardQuery.statement.to_sql_extended(this.connection, null, StatementSqlFlag.PRETTY)}`);

    const dm = this.connection.statement_execute_select(clipboardQuery.statement, null);

    const iter = dm.create_iter();
    const itemList: DBItem[] = [];

    while (iter.move_next()) {
      const id = iter.get_value_for_field('id') as any as number;
      const itemType = iter.get_value_for_field('itemType') as any as string;
      const content = iter.get_value_for_field('content') as any as string;
      const copyDate = iter.get_value_for_field('copyDate') as any as string;
      const isFavorite = iter.get_value_for_field('isFavorite') as any as string;
      const matchValue = iter.get_value_for_field('matchValue') as any as string;
      const searchValue = iter.get_value_for_field('searchValue') as any as string;
      const metaData = iter.get_value_for_field('metaData') as any as string;

      itemList.push({
        id,
        itemType,
        content,
        copyDate: new Date(copyDate),
        isFavorite: !!isFavorite,
        matchValue,
        searchValue,
        metaData,
      });
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
