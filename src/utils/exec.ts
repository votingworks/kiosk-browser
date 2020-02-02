import { execFile } from 'child_process'
import { promisify } from 'util'

// This is here mainly to make mocking easier.
export default promisify(execFile)
