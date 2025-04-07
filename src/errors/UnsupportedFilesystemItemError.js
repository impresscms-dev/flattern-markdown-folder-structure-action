/**
 * Error thrown when an unsupported filesystem item is encountered
 */
export default class UnsupportedFilesystemItemError extends Error {
  /**
   * @param {string} file - The file path that caused the error
   */
  constructor(file) {
    super(`${file} is unsupported filesystem item. Can't process.`)
  }
}
