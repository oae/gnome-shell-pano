import Gda5 from '@girs/gda-5.0';
import { add_expr_value, type DataModelIter, type SqlBuilder, unescape_string } from '@pano/utils/gda_compatibility';
import { logger } from '@pano/utils/shell';

const debug = logger('database');

export type ItemType = 'IMAGE' | 'LINK' | 'TEXT' | 'CODE' | 'COLOR' | 'EMOJI' | 'FILE';

export type DBItem = {
  id: number;
  itemType: ItemType;
  content: string;
  copyDate: Date;
  isFavorite: boolean;
  matchValue: string;
  searchValue?: string | undefined;
  metaData?: string | undefined;
};

export type SaveDBItem = Omit<DBItem, 'id'>;

class ClipboardQuery {
  readonly statement: Gda5.Statement;

  constructor(statement: Gda5.Statement) {
    this.statement = statement;
  }
}

export class ClipboardQueryBuilder {
  private readonly builder: Gda5.SqlBuilder;
  private conditions: number[];

  constructor() {
    this.conditions = [];
    this.builder = new Gda5.SqlBuilder({
      stmt_type: Gda5.SqlStatementType.SELECT,
    });
    this.builder.select_add_field('id', 'clipboard', 'id');
    this.builder.select_add_field('itemType', 'clipboard', 'itemType');
    this.builder.select_add_field('content', 'clipboard', 'content');
    this.builder.select_add_field('copyDate', 'clipboard', 'copyDate');
    this.builder.select_add_field('isFavorite', 'clipboard', 'isFavorite');
    this.builder.select_add_field('matchValue', 'clipboard', 'matchValue');
    this.builder.select_add_field('searchValue', 'clipboard', 'searchValue');
    this.builder.select_add_field('metaData', 'clipboard', 'metaData');

    this.builder.select_order_by(this.builder.add_field_id('copyDate', 'clipboard'), false, null);

    this.builder.select_add_target('clipboard', null);
  }

  withLimit(limit: number, offset: number) {
    this.builder.select_set_limit(add_expr_value(this.builder, limit), add_expr_value(this.builder, offset));

    return this;
  }

  withId(id?: number | null) {
    if (id !== null && id !== undefined) {
      this.conditions.push(
        this.builder.add_cond(
          Gda5.SqlOperatorType.EQ,
          this.builder.add_field_id('id', 'clipboard'),
          add_expr_value(this.builder, id),
          0,
        ),
      );
    }

    return this;
  }

  withItemTypes(itemTypes?: ItemType[] | null) {
    if (itemTypes !== null && itemTypes !== undefined) {
      const orConditions = itemTypes.map((itemType) =>
        this.builder.add_cond(
          Gda5.SqlOperatorType.EQ,
          this.builder.add_field_id('itemType', 'clipboard'),
          add_expr_value(this.builder, itemType),
          0,
        ),
      );
      this.conditions.push(this.builder.add_cond_v(Gda5.SqlOperatorType.OR, orConditions));
    }

    return this;
  }

  withContent(content?: string | null) {
    if (content !== null && content !== undefined) {
      this.conditions.push(
        this.builder.add_cond(
          Gda5.SqlOperatorType.EQ,
          this.builder.add_field_id('content', 'clipboard'),
          add_expr_value(this.builder, content),
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
          Gda5.SqlOperatorType.EQ,
          this.builder.add_field_id('matchValue', 'clipboard'),
          add_expr_value(this.builder, matchValue),
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
          Gda5.SqlOperatorType.LIKE,
          this.builder.add_field_id('content', 'clipboard'),
          add_expr_value(this.builder, `%${content}%`),
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
          Gda5.SqlOperatorType.LIKE,
          this.builder.add_field_id('searchValue', 'clipboard'),
          add_expr_value(this.builder, `%${searchValue}%`),
          0,
        ),
      );
    }

    return this;
  }

  withFavorites(include: boolean) {
    if (include !== null && include !== undefined) {
      this.conditions.push(
        this.builder.add_cond(
          Gda5.SqlOperatorType.EQ,
          this.builder.add_field_id('isFavorite', 'clipboard'),
          add_expr_value(this.builder, +include),
          0,
        ),
      );
    }

    return this;
  }

  build(): ClipboardQuery {
    if (this.conditions.length > 0) {
      this.builder.set_where(this.builder.add_cond_v(Gda5.SqlOperatorType.AND, this.conditions));
    }

    return new ClipboardQuery(this.builder.get_statement());
  }
}
class Database {
  private connection: Gda5.Connection | null = null;

  private init(dbPath: string) {
    this.connection = new Gda5.Connection({
      provider: Gda5.Config.get_provider('SQLite'),
      cncString: `DB_DIR=${dbPath};DB_NAME=pano`,
    });
    this.connection.open();
  }

  setup(dbPath: string) {
    this.init(dbPath);
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

  save(dbItem: SaveDBItem): DBItem | null {
    if (!this.connection || !this.connection.is_opened()) {
      debug('connection is not opened');
      return null;
    }

    const builder = new Gda5.SqlBuilder({
      stmt_type: Gda5.SqlStatementType.INSERT,
    }) as SqlBuilder<DBItem>;

    builder.set_table('clipboard');
    //Note: casting required, since this is a gjs convention, that you don't have to pass a  GObject.Value, this is needed for teh C API, but GJS constructs it on the fly
    builder.add_field_value_as_gvalue('itemType', dbItem.itemType);
    builder.add_field_value_as_gvalue('content', dbItem.content);
    builder.add_field_value_as_gvalue('copyDate', dbItem.copyDate.toISOString());
    builder.add_field_value_as_gvalue('isFavorite', +dbItem.isFavorite);
    builder.add_field_value_as_gvalue('matchValue', dbItem.matchValue);
    if (dbItem.searchValue) {
      builder.add_field_value_as_gvalue('searchValue', dbItem.searchValue);
    }
    if (dbItem.metaData) {
      builder.add_field_value_as_gvalue('metaData', dbItem.metaData);
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

  update(dbItem: DBItem): DBItem | null {
    if (!this.connection || !this.connection.is_opened()) {
      debug('connection is not opened');
      return null;
    }

    const builder = new Gda5.SqlBuilder({
      stmt_type: Gda5.SqlStatementType.UPDATE,
    }) as SqlBuilder<DBItem>;

    builder.set_table('clipboard');
    //Note: casting required, since this is a gjs convention, that you don't have to pass a  GObject.Value, this is needed for teh C API, but GJS constructs it on the fly
    builder.add_field_value_as_gvalue('itemType', dbItem.itemType);
    builder.add_field_value_as_gvalue('content', dbItem.content);
    builder.add_field_value_as_gvalue('copyDate', dbItem.copyDate.toISOString());
    builder.add_field_value_as_gvalue('isFavorite', +dbItem.isFavorite);
    builder.add_field_value_as_gvalue('matchValue', dbItem.matchValue);
    if (dbItem.searchValue) {
      builder.add_field_value_as_gvalue('searchValue', dbItem.searchValue);
    }
    if (dbItem.metaData) {
      builder.add_field_value_as_gvalue('metaData', dbItem.metaData);
    }
    builder.set_where(
      builder.add_cond(
        Gda5.SqlOperatorType.EQ,
        builder.add_field_id('id', 'clipboard'),
        add_expr_value(builder, dbItem.id),
        0,
      ),
    );
    this.connection.statement_execute_non_select(builder.get_statement(), null);

    return dbItem;
  }

  delete(id: number): void {
    if (!this.connection || !this.connection.is_opened()) {
      debug('connection is not opened');
      return;
    }

    const builder = new Gda5.SqlBuilder({
      stmt_type: Gda5.SqlStatementType.DELETE,
    });

    builder.set_table('clipboard');
    builder.set_where(
      builder.add_cond(
        Gda5.SqlOperatorType.EQ,
        builder.add_field_id('id', 'clipboard'),
        add_expr_value(builder, id),
        0,
      ),
    );
    this.connection.statement_execute_non_select(builder.get_statement(), null);
  }

  query(clipboardQuery: ClipboardQuery): DBItem[] {
    if (!this.connection || !this.connection.is_opened()) {
      return [];
    }

    // debug(`${clipboardQuery.statement.to_sql_extended(this.connection, null, StatementSqlFlag.PRETTY)}`);

    const dm = this.connection.statement_execute_select(clipboardQuery.statement, null);

    const iter = dm.create_iter() as DataModelIter<DBItem>;
    const itemList: DBItem[] = [];

    while (iter.move_next()) {
      //Note: casting required, since this is a gjs convention, that any GObject.Value is just the value (e.g. string, number etc.) this types are from C, so there is no dynamic return value so they have to use GObject.Value
      const id = iter.get_value_for_field('id');
      const itemType = iter.get_value_for_field('itemType');
      const content = iter.get_value_for_field('content');
      const contentUnescaped = unescape_string(content) ?? content;
      const copyDate = iter.get_value_for_field('copyDate');
      const isFavorite = iter.get_value_for_field('isFavorite');
      const matchValue = iter.get_value_for_field('matchValue');
      const matchValueUnescaped = unescape_string(matchValue) ?? matchValue;
      const searchValue = iter.get_value_for_field('searchValue');
      const searchValueUnescaped = searchValue ? (unescape_string(searchValue) ?? searchValue) : undefined;
      const metaData = iter.get_value_for_field('metaData');

      itemList.push({
        id,
        itemType,
        content: contentUnescaped,
        copyDate: new Date(copyDate),
        isFavorite: !!isFavorite,
        matchValue: matchValueUnescaped,
        searchValue: searchValueUnescaped,
        metaData,
      });
    }

    return itemList;
  }

  start(dbPath: string) {
    if (!this.connection && dbPath) {
      this.init(dbPath);
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
