import {getInput} from '@actions/core'
import FileStructureFlatterer from './helpers/FileStructureFlatterer.js'
import fs from 'fs'

const flatterer = new FileStructureFlatterer(fs)
flatterer.exec(fs.realpathSync(getInput('path', {required: true})))
