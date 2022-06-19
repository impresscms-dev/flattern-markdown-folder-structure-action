import process from "node:process"

/**
 * Works with files executions
 */
class ExecutionHandler {
  /**
   * Replace Windows path separator with Unix
   *
   * @param {string} path Path to replace
   *
   * @return string
   */
  replaceWinPathCharToUnix(path: string): string {
    return path.replace(/\\/g, '/')
  }

  /**
   * Renders command
   *
   * @param {string} cmd Command to render
   * @param {string[]} args Command arguments
   */
  render(cmd: string, args: string[] = []): string {
    return cmd
      .concat(' ', args.map(arg => this.escapeShellArg(arg)).join(' '))
      .trim()
  }

  /**
   * Prepares ENV options array
   *
   * @param {object} env Env data
   *
   * @return object
   */
  protected prepareEnvOptions(env: {
    [x: string]: string
  }): {[x: string]: string} {
    return Object.assign({}, process.env, env)
  }

  /**
   * Escapes shell arg
   *
   * @param {string} arg Argument to escape
   *
   * @return string
   */
  escapeShellArg(arg: string): string {
    let ret = ''

    ret = arg.replace(/[^\\]'/g, (m: string) => {
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
   * @return boolean
   */
  isRunningOnWindows(): boolean {
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
   */
  suffixExtIfRunningOnWindows(
    filename: string,
    winExt = 'bat'
  ): string {
    return this.isRunningOnWindows() ? filename.concat('.', winExt) : filename
  }
}

export default new ExecutionHandler()
