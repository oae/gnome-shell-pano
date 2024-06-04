import { ClipboardQueryBuilder, db, type SaveDBItem } from '@pano/utils/db';
import fs from 'fs/promises';
import path from 'path';

function getDBpath() {
  return path.join(__dirname, 'test.db');
}

beforeAll(() => {
  db.setup(getDBpath());
});

afterAll(async () => {
  await fs.unlink(getDBpath());
});

describe('db', () => {
  it('storing and loading should work with values that need escaping', async () => {
    type Value = string | { file: string };

    async function getContent(value: Value): Promise<string> {
      if (typeof value === 'string') {
        return value;
      }

      const filePath = path.join(__dirname, 'files', value.file);

      const buffer = await fs.readFile(filePath);

      return buffer.toString();
    }

    const testValues: Array<Value> = [
      'a simple string',
      'a string that has many \\ in it \\\\n \\\\begin{math}',
      "also \\' need escapeing in sql queries '''''''' ' ' '' ''' \\' \\\\'",
      { file: 'test.tex' },
    ];

    for (const value of testValues) {
      const content = await getContent(value);

      const dbItem: SaveDBItem = {
        content,
        copyDate: new Date(),
        isFavorite: false,
        itemType: 'TEXT',
        matchValue: content,
        searchValue: content,
      };

      const result = db.save(dbItem);

      expect(result).not.toBe(null);

      const foundItems = db.query(new ClipboardQueryBuilder().withId(result!.id).build());

      expect(foundItems.length).toBe(1);

      expect(foundItems[0]!.content).toBe(content);
    }
  });
});
