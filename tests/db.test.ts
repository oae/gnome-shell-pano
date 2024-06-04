import Gio from '@girs/gio-2.0';
import { ClipboardQueryBuilder, db, type SaveDBItem } from '@pano/utils/db';
import { deleteDirectory } from '@pano/utils/shell';

function fail(reason: string = 'fail was called in a test.'): never {
  throw new Error(reason);
}

const DB_PATH = 'tests/database/';

async function getDBpath(): Promise<[string, Gio.File]> {
  const file = Gio.File.new_for_path(DB_PATH);
  if (file.query_exists(null)) {
    await deleteDirectory(file);
  }

  file.make_directory_with_parents(null);

  const path = file.get_path();
  if (!path) {
    fail('DB Path error');
  }
  return [path, file];
}

beforeAll(async () => {
  const [path, _] = await getDBpath();
  db.setup(path);
});

afterAll(async () => {
  const [_, file] = await getDBpath();
  await deleteDirectory(file);
});

describe('db', () => {
  it('storing and loading should work with values that need escaping', async () => {
    const testValues: string[] = [
      'a simple string',
      'a string that has many \\ in it \\\\n \\\\begin{math}',
      "also \\' need escaping in sql queries '''''''' ' ' '' ''' \\' \\\\'",
      '% example LaTeX document from: https://guides.nyu.edu/LaTeX/sample-document\n' +
        '\n' +
        '% This is a simple sample document.  For more complicated documents take a look in the exercise tab. Note that everything that comes after a % symbol is treated as comment and ignored when the code is compiled.\n' +
        '\n' +
        '\\documentclass{article} % \\documentclass{} is the first command in any LaTeX code.  It is used to define what kind of document you are creating such as an article or a book, and begins the document preamble\n' +
        '\n' +
        '\\usepackage{amsmath} % \\usepackage is a command that allows you to add functionality to your LaTeX code\n' +
        '\n' +
        '\\title{Simple Sample} % Sets article title\n' +
        '\\author{My Name} % Sets authors name\n' +
        '\\date{\\today} % Sets date for date compiled\n' +
        '\n' +
        '% The preamble ends with the command \\begin{document}\n' +
        '\\begin{document} % All begin commands must be paired with an end command somewhere\n' +
        '    \\maketitle % creates title using information in preamble (title, author, date)\n' +
        '    \n' +
        '    \\section{Hello World!} % creates a section\n' +
        '    \n' +
        '    \\textbf{Hello World!} Today I am learning \\LaTeX. %notice how the command will end at the first non-alphabet charecter such as the . after \\LaTeX\n' +
        '     \\LaTeX{} is a great program for writing math. I can write in line math such as $a^2+b^2=c^2$ %$ tells LaTexX to compile as math\n' +
        '     . I can also give equations their own space: \n' +
        '    \\begin{equation} % Creates an equation environment and is compiled as math\n' +
        '    \\gamma^2+\\theta^2=\\omega^2\n' +
        '    \\end{equation}\n' +
        '    If I do not leave any blank lines \\LaTeX{} will continue  this text without making it into a new paragraph.  Notice how there was no indentation in the text after equation (1).  \n' +
        '    Also notice how even though I hit enter after that sentence and here $\\downarrow$\n' +
        "     \\LaTeX{} formats the sentence without any break.  Also   look  how      it   doesn't     matter          how    many  spaces     I put     between       my    words.\n" +
        '    \n' +
        '    For a new paragraph I can leave a blank space in my code. \n' +
        '\n' +
        '\\end{document} % This is the end of the document\n',
    ];

    for (const content of testValues) {
      const dbItem: SaveDBItem = {
        content,
        copyDate: new Date(),
        isFavorite: false,
        itemType: 'TEXT',
        matchValue: content,
        searchValue: content,
      };

      const result = db.save(dbItem);

      expect(result).not.toEqual(null);

      const foundItems = db.query(new ClipboardQueryBuilder().withId(result!.id).build());

      expect(foundItems.length).toBe(1);

      expect(foundItems[0]!.content).toBe(content);
    }
  });
});
