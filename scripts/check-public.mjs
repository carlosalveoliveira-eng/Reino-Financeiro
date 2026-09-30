import {readdir,readFile} from 'node:fs/promises';
import {join} from 'node:path';
import assert from 'node:assert/strict';
async function walk(dir){const files=[];for(const entry of await readdir(dir,{withFileTypes:true})){const path=join(dir,entry.name);files.push(...entry.isDirectory()?await walk(path):[path])}return files}
const files=await walk('dist-portfolio');
for(const file of files){
 assert.ok(!/(\.env|\.sqlite|\.ofx|\.csv|\.pem|\.zip|hosting\.json|reino-financeiro-.*\.json)$/i.test(file),'Forbidden publication file: '+file);
 if(/\.(js|html|json|css)$/.test(file)){
  const text=await readFile(file,'utf8');
  assert.ok(!/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|gh[pousr]_[A-Za-z0-9]{30,}|sk-(?:proj-)?[A-Za-z0-9_-]{40,}|appgprj_[a-f0-9]{32}/.test(text),'Sensitive content detected in '+file);
 }
}
assert.ok(files.some(x=>x.endsWith('index.html')));
console.log(`${files.length} public artifact files checked; no forbidden exports or known secret patterns.`);
