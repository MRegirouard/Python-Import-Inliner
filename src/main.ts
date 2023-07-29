import * as fs from 'fs'
import * as path from 'path'
import processFile from './import-inliner'

if (process.argv.length < 4) {
	console.error(`Usage: ${process.argv[0]} ${process.argv[1]} <main file> <output file> [path1] [path2]...`)
	console.error('    main file: The main file to process. Imports will be inlined where possible.')
	console.error('    output file: The file to write the processed code to.')
	console.error('    path1, path2, etc.: Paths to search for modules in.')
	process.exit(1)
}

const mainFile = process.argv[2]

if (!fs.existsSync(mainFile)) {
	console.error(`File not found: ${mainFile}`)
	process.exit(1)
}

const outputFile = process.argv[3]
const paths = [path.dirname(mainFile)].concat(...process.argv.slice(4))

for (const path of paths) {
	if (!fs.existsSync(path)) {
		console.error(`Path not found: ${path}`)
		process.exit(1)
	}
}

const data = processFile(mainFile, paths)
fs.writeFileSync(outputFile, data)
