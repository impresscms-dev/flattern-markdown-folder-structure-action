import {getInput} from '@actions/core'
import FileStructureFlatterer from './helpers/FileStructureFlatterer'

const flatterer = new FileStructureFlatterer()
flatterer.exec(getInput('path', {required: true}))
