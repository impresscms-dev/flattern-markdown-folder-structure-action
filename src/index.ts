import {getInput} from '@actions/core'
import FileStructureFlatterer from './helpers/FileStructureFlatterer'
import {realpathSync} from "fs"

const flatterer = new FileStructureFlatterer()
flatterer.exec(
  realpathSync(
    getInput('path', {required: true})
  )
)
