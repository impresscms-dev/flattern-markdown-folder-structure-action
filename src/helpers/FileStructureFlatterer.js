import {debug, isDebug} from '@actions/core'
import {basename, extname} from 'path'
import Execution from '../helpers/Execution.js'
import UnsupportedFilesystemItemError from '../errors/UnsupportedFilesystemItemError.js'

/**
 * Class to flatten file structure with markdown data
 */
export default class FileStructureFlatterer {

  /**
   * @type {import('fs')}
   */
  #fs

  /**
   * @param {import('fs')} fs - Filesystem module
   */
  constructor(fs) {
    this.#fs = fs
  }

  /**
   * Execute the flattening process
   * @param {string} path - Path to flatten
   */
  exec(path) {
    const filenames = this.generateNewStructData(path)
    const flippedFilenames = this.flipKeysWithValues(filenames)
    for (const newFilename in filenames) {
      const oldFilename = filenames[newFilename]
      if (oldFilename !== newFilename) {
        this.renameFile(path, oldFilename, newFilename)
      }
    }
    for (const newFilename in filenames) {
      this.fixesToNewStyleLinks(
        path.concat('/', newFilename),
        flippedFilenames
      )
    }
  }

  /**
   * Returns all files recursively in path
   *
   * @param {string} path - Path where to look for
   * @return {string[]} List of files
   */
  readDirSync(path) {
    const files = []
    const dirs = ['.']
    while (dirs.length > 0) {
      const dir = dirs.pop()
      const contents = this.#fs.readdirSync(`${path}/${dir}`)

      for (const item of contents) {
        const relativePath = `${dir}/${item.toString()}`
        const fullPath = `${path}/${relativePath}`
        const info = this.#fs.lstatSync(fullPath)
        if (info.isDirectory()) {
          dirs.push(relativePath)
          continue
        }

        if (info.isFile()) {
          files.push(
            relativePath.substring(2)
          )
          continue
        }

        throw new UnsupportedFilesystemItemError(relativePath)
      }
    }

    return files
  }

  /**
   * Generate filenames data for new files structure
   *
   * @param {string} cwd - Docs path
   * @return {object} Mapping of new filenames to old filenames
   */
  generateNewStructData(cwd) {
    const newStructData = {}
    const files = this.getAllFilesInfo(cwd)
    for (const fileInfo of this.filterFileInfoByShortPath(files, false)) {
      newStructData[fileInfo.filename] = fileInfo.filename
    }

    for (const fileInfo of this.filterFileInfoByShortPath(files, true)) {
      let oldFilePath = fileInfo.shortPath.concat('/', fileInfo.filename)
      if (Execution.isRunningOnWindows()) {
        oldFilePath = oldFilePath.replace(/\\/g, '/')
      }
      if (oldFilePath.startsWith('/')) {
        oldFilePath = oldFilePath.substring(1)
      }
      if (typeof newStructData[fileInfo.filename] == 'undefined') {
        newStructData[fileInfo.filename] = oldFilePath
      } else {
        newStructData[this.generateAltFilename(fileInfo)] = oldFilePath
      }
    }
    return newStructData
  }

  /**
   * Fixes links to new style
   *
   * @param {string} filename - Filename where to fix links
   * @param {object} filenames - Filenames data to fix
   */
  fixesToNewStyleLinks(filename, filenames) {
    if (isDebug()) {
      debug(` Fixing ${filename}...`)
    }
    const content = this.#fs.readFileSync(filename, 'utf8')
    const allPossibleFilenames = {}
    for (const oldFilename in filenames) {
      const currentFilename = filenames[oldFilename]
      allPossibleFilenames[oldFilename] = currentFilename
      const linFilename = oldFilename.replace(/\\/g, '/')
      allPossibleFilenames[linFilename] = currentFilename
      if (extname(oldFilename) === '.md') {
        allPossibleFilenames[
          oldFilename.substring(0, oldFilename.length - 3)
          ] = currentFilename
      }
      if (extname(linFilename) === '.md') {
        allPossibleFilenames[
          linFilename.substring(0, linFilename.length - 3)
          ] = currentFilename
      }
      const winFilename = oldFilename.replace(/\//g, '\\')
      allPossibleFilenames[winFilename] = currentFilename
      if (extname(winFilename) === '.md') {
        allPossibleFilenames[
          winFilename.substring(0, winFilename.length - 3)
          ] = currentFilename
      }
    }
    // noinspection RegExpRedundantEscape
    const newContent = content.replace(
      /\[([^\]]+)]\(([^\)]+)\)/gm,
      (fullMsg, name, link) => {
        if (typeof allPossibleFilenames[link] !== 'undefined') {
          const jstr = allPossibleFilenames[link]
            .split('.')
            .slice(0, -1)
            .join('.')
          return `[${name}](${jstr})`
        }
        return fullMsg
      }
    )
    if (newContent !== content) {
      if (isDebug()) {
        debug('  Changed.')
      }
      this.#fs.writeFileSync(filename, newContent)
    }
  }

  /**
   * Flip keys with values for object
   *
   * @param {object} obj - Object to flip
   * @return {object} Flipped object
   */
  flipKeysWithValues(obj) {
    const ret = {}
    for (const x in obj) {
      ret[obj[x]] = x
    }
    return ret
  }

  /**
   * Gets all files info in path
   *
   * @param {string} cwd - Path where to get files info
   * @return {Array<{filename: string, shortPath: string}>} Array of file info objects
   */
  getAllFilesInfo(cwd) {
    return this.readDirSync(cwd).map((file) => {
      const shortFilename = basename(file)
      const pathPrefix = file.substring(0, file.length - shortFilename.length - 1)
      return {
        filename: shortFilename,
        shortPath: pathPrefix
      }
    })
  }

  /**
   * Renames file
   *
   * @param {string} newDocs - New docs
   * @param {string} oldFilename - Old filename
   * @param {string} newFilename - New filename
   */
  renameFile(newDocs, oldFilename, newFilename) {
    if (isDebug()) {
      debug(` Renaming ${oldFilename} -> ${newFilename}...`)
    }
    this.#fs.renameSync(
      newDocs.concat('/', oldFilename),
      newDocs.concat('/', newFilename)
    )
  }

  /**
   * Filters file infos by short path
   *
   * @param {Array<{filename: string, shortPath: string}>} files - Files to filter
   * @param {boolean} withShortPath - Should have anything in short path
   * @return {Array<{filename: string, shortPath: string}>} Filtered files
   */
  filterFileInfoByShortPath(files, withShortPath) {
    return files.filter((fileInfo) => {
      return withShortPath
        ? fileInfo.shortPath !== ''
        : fileInfo.shortPath === ''
    })
  }

  /**
   * Generates alternative filename
   *
   * @param {{filename: string, shortPath: string}} fileInfo - Fileinfo from where to generate new filename
   * @return {string} Alternative filename
   */
  generateAltFilename(fileInfo) {
    const filenameWithoutExt = fileInfo.filename
      .split('.')
      .slice(0, -1)
      .join('.')
    const ext = extname(fileInfo.filename)
    let namespaceName = fileInfo.shortPath.replace(/\//g, '⁄')
    if (namespaceName.startsWith('⁄')) {
      namespaceName = namespaceName.substring(1)
    }
    return `${filenameWithoutExt} (${namespaceName})${ext}`
  }
}
