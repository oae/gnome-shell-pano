

// jasmine-gjs is really bad at resolving imports, so we need to do something about it


const fs = require("fs/promises")
const path = require("path")

const root = process.argv[2]

const srcRoot = path.join(root, "build", "src")

async function fix(file) {

  const content = (await fs.readFile(file)).toString();

  const folder = path.dirname(file)

  const replaced1 = content.replaceAll(/'@pano\/(.*)'/g, (_all, captured) => {
    const importPath = path.join(srcRoot, captured);


    const relative = path.relative(folder, importPath)
    //console.log(file, importPath, relative)

    const ending = importPath.endsWith(".js") ? "" : ".js"

    return `'./${relative}${ending}'`

  })

  const replaced2 = replaced1.replaceAll(/'@girs\/(.*)'/g, (_all, captured) => {

    const name = captured.split("-")[0]

    const version = ""

    return `'gi://${name}${version}'`

  })


  await fs.writeFile(file, replaced2)


}

async function start() {

  process.argv.splice(0, 3)


  for (const elem of process.argv) {
    await fix(elem)
  }
}

start()
