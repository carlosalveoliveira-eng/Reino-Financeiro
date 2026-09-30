import {spawnSync} from 'node:child_process';
import {readFileSync,writeFileSync} from 'node:fs';
const compiled=spawnSync(process.execPath,['node_modules/typescript/bin/tsc','domain/form-command.ts','--target','ES2022','--module','ES2022','--moduleResolution','bundler','--outDir','.sites-runtime/form-build','--skipLibCheck'],{stdio:'inherit'});
if(compiled.status!==0)process.exit(compiled.status||1);
const p='.sites-runtime/form-build/domain/form-command.js';writeFileSync(p,readFileSync(p,'utf8').replaceAll("from './finance'","from './finance.js'").replaceAll("from '../validations/finance'","from '../validations/finance.js'"));
const tests=spawnSync(process.execPath,['tests/forms.test.mjs'],{stdio:'inherit'});process.exit(tests.status||0);
