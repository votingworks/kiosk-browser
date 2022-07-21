import { promisify } from 'util';
import { exec } from 'child_process';

const promisifiedExec = promisify(exec);
export default promisifiedExec;
