import * as fs from 'fs'
import * as path from 'path'

/**
 * Search for a module in a list of paths.
 * @param module The module to search for. Will look for a file named <module>.py
 * @param paths A list of paths to search in.
 * @returns The path to the module, or null if not found.
 */
function findModule(module: string, paths: string[]): string | null {
	for (const dir of paths) {
		const modulePath = path.join(dir, module + '.py')

		if (fs.existsSync(modulePath)) {
			return path.join(dir, module + '.py')
		}
	}
	
	return null
}

/**
 * Parse a line of code to see if it's a supported import statement (from <module> import *).
 * @param line The Python line to parse.
 * @returns The module name if the line is an import statement, or null if not.
 */
function parseLine(line: string): string | null {
	const splitLine = line.trim().split(' ')

	// Look for a supported import statement: from <module> import *
	if (line.trimStart().startsWith('from ') && line.endsWith(' import *')) {
		const module = splitLine[1].trim()
		return module
	}
	
	return null;
}

/**
 * Process a file, inlining imports where possible, and returning the processed code.
 * @param file The path to the file to process.
 * @param paths A list of paths to search for modules in. 
 * @param imported A list of modules that have already been imported. Used to prevent duplicate imports.
 * @returns The processed code.
 */
function processFile(file: string, paths: string[], imported: string[] = []): string {
	// Read the file and split it into lines
	const lines = fs.readFileSync(file).toString().split('\n')
	let data = ''

	// Process each line
	lines.forEach((line: string) => {
		const module = parseLine(line)

		// If the line isn't an import statement, just add it to the output
		if (module == null) {
			data += line + '\n'
			return
		}

		// Add some comments to the output to show where the import statement was
		data += '\n'
		data += `# IMPORT BEGIN ${module}\n`
		data += `# IMPORT STATEMENT: ${line}\n`

		// Ignore the import if it's already been imported
		if (imported.includes(module)) {
			data += '# IMPORT IGNORED: ALREADY PRESENT\n'
			data += `# IMPORT END ${module}\n`
			data += '\n'
			return
		}

		// Mark the module as imported so we don't import it again
		imported.push(module)

		// Locate the module
		const importedFilePath = findModule(module, paths)
		
		if (importedFilePath == null) {
			data += '# IMPORT FILE NOT FOUND\n'
			data += '# CHECK PYTHON MODULE SEARCH PATH\n'
			// Add the import statement to the output, maybe Python can find it at runtime
			data += line + '\n'
			data += `# IMPORT END ${module}\n`
			data += '\n'
			return
		}

		// Process the module, to resolve any imports it may have
		data += processFile(importedFilePath, paths, imported)
		data += `# IMPORT END ${module}\n`
		data += '\n'
	})

	return data
}

export default processFile
