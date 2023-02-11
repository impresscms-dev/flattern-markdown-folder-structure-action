import {debug} from '@actions/core'
import {basename, dirname, extname} from 'path'
import Execution from '../helpers/Execution'
import UnsupportedFilesystemItemError from '../errors/UnsupportedFilesystemItemError'

export default class FileStructureFlatterer {
  #fs: any

  constructor(fs: any) {
    this.#fs = fs;
  }

  /**
   * @inheritDoc
   */
  exec(path: string): void {
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
   * Returns all files recusrively in path
   *
   * @param {string} path Path where to look for
   */
  protected readDirSync(path: string): string[] {
    let files = [];
    let dirs = ['.'];
    let dir: string|undefined;
    while (dir = dirs.pop()) {
      let contents = this.#fs.readdirSync(path + '/' + dir);

      for (let i = 0; i < contents.length; i++) {
        const item: string = contents[i];

        let relativePath = dir + '/' + item.toString();
        let fullPath = path + '/' + relativePath;
        let info = this.#fs.lstatSync(fullPath);
        if (info.isDirectory()) {
          dirs.push(relativePath);
          continue;
        }

        if (info.isFile()) {
          files.push(
            relativePath.substring(2)
          );
          continue;
        }

        throw new UnsupportedFilesystemItemError(relativePath);
      }
    }

    return files;
  }

  /**
   * Generate filenames data for new files structure
   *
   * @param {string} cwd Docs path
   */
  protected generateNewStructData(cwd: string): {[x: string]: string} {
    const newStructData: {[x: string]: string} = {}
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
   * @param {string} filename Filename where to fix links
   * @param {object} filenames Filenames data to fix
   */
  protected fixesToNewStyleLinks(
    filename: string,
    filenames: {[x: string]: string}
  ): void {
    debug(` Fixing ${filename}...`)
    const content = this.#fs.readFileSync(filename, 'utf8')
    const allPossibleFilenames: {[x: string]: string} = {}
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
    const newContent = content.replace(
      /\[([^\]]+)]\(([^\)]+)\)/gm,
      (fullMsg: string, name: string, link: string) => {
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
      debug('  Changed.')
      this.#fs.writeFileSync(filename, newContent)
    }
  }

  /**
   * Flip keys with values for object
   *
   * @param {object} obj Object to flip
   */
  protected flipKeysWithValues(obj: {
    [x: string]: string
  }): {[x: string]: string} {
    const ret: {[x: string]: string} = {}
    for (const x in obj) {
      ret[obj[x]] = x
    }
    return ret
  }

  /**
   * Gets all files info in path
   *
   * @param {string} cwd Path where to get files info
   */
  private getAllFilesInfo(
    cwd: string
  ): {filename: string; shortPath: string}[] {
    return this.readDirSync(cwd).map((file: string) => {
      const shortFilename = basename(file)
      const pathWithoutFilename = dirname(file)
      const pathPrefix = pathWithoutFilename.substring(cwd.length)
      return {
        filename: shortFilename,
        shortPath: pathPrefix
      }
    })
  }

  /**
   * Renames file
   *
   * @param {string} newDocs New docs
   * @param {string} oldFilename Old filename
   * @param {string} newFilename New filename
   */
  protected renameFile(
    newDocs: string,
    oldFilename: string,
    newFilename: string
  ): void {
    debug(` Renaming ${oldFilename} -> ${newFilename}...`)
    this.#fs.renameSync(
      newDocs.concat('/', oldFilename),
      newDocs.concat('/', newFilename)
    )
  }

  /**
   * Filters file infos by short path
   *
   * @param {object[]} files Files to filter
   * @param {boolean} withShortPath Should have anything in short path
   */
  private filterFileInfoByShortPath(
    files: {filename: string; shortPath: string}[],
    withShortPath: boolean
  ): {filename: string; shortPath: string}[] {
    return files.filter((fileInfo: {filename: string; shortPath: string}) => {
      return withShortPath
        ? fileInfo.shortPath !== ''
        : fileInfo.shortPath === ''
    })
  }

  /**
   * Generates alternative filename
   *
   * @param {object} fileInfo Fileinfo from where to generate new filename
   */
  private generateAltFilename(fileInfo: {
    filename: string
    shortPath: string
  }): string {
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
