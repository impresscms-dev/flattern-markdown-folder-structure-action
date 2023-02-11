export default class UnsupportedFilesystemItemError extends Error {
  constructor(file: string) {
    super(`${file} is unsupported filesystem item. Can't process.`);
  }

}