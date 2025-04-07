import process from "node:process"

/**
 * Works with files executions
 */
class ExecutionHandler {
  /**
   * Replace Windows path separator with Unix
   *
   * @param {string} path Path to replace
   * @return {string} Path with Unix separators
   */
  replaceWinPathCharToUnix(path) {
    return path.replace(/\\/g, '/')
  }

  /**
   * Renders command
   *
   * @param {string} cmd Command to render
   * @param {string[]} args Command arguments
   * @return {string} Rendered command
   */
  render(cmd, args = []) {
    return cmd
      .concat(' ', args.map(arg => this.escapeShellArg(arg)).join(' '))
      .trim()
  }

  /**
   * Prepares ENV options array
   *
   * @param {object} env Env data
   * @return {object} Prepared environment options
   */
  prepareEnvOptions(env) {
    return Object.assign({}, process.env, env)
  }

  /**
   * Escapes shell arg
   *
   * @param {string} arg Argument to escape
   * @return {string} Escaped argument
   */
  escapeShellArg(arg) {
    // noinspection JSUnusedAssignment
    let ret = ''

    ret = arg.replace(/[^\\]'/g, (m) => {
      return m.slice(0, 1).concat("\\'")
    })

    if (ret.includes(' ') || ret.includes('*')) {
      return `'${ret}'`
    }

    return ret
  }

  /**
   * Is running on Windows?
   *
   * @return {boolean} True if running on Windows
   */
  isRunningOnWindows() {
    return (
      process.platform.toString() === 'win32' ||
      process.platform.toString() === 'win64'
    )
  }

  /**
   * Sufixes file extension if running on windows
   *
   * @param {string} filename Filename for witch add extension
   * @param {string} winExt Extension to add
   * @return {string} Filename with extension if on Windows
   */
  suffixExtIfRunningOnWindows(filename, winExt = 'bat') {
    return this.isRunningOnWindows() ? filename.concat('.', winExt) : filename
  }
}

export default new ExecutionHandler()
