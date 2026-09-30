import {copyFile, mkdir, writeFile} from 'node:fs/promises';
await copyFile('dist-portfolio/portfolio.html','dist-portfolio/index.html');
for(const route of ['demo','apresentacao']){await mkdir('dist-portfolio/'+route,{recursive:true});await copyFile('dist-portfolio/portfolio.html','dist-portfolio/'+route+'/index.html')}
await writeFile('dist-portfolio/_redirects','/demo /portfolio.html 200\n/apresentacao /portfolio.html 200\n');
