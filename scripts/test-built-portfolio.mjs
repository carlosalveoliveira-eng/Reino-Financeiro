import {preview} from 'vite';
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';

const server=await preview({configFile:'vite.portfolio.config.ts',preview:{host:'127.0.0.1',port:4174,strictPort:true}});
let browser;
try {
 browser=await chromium.launch();
 const page=await browser.newPage();
 const api=[],failures=[];
 page.on('request',r=>{if(r.url().includes('/api/finance'))api.push(r.url())});
 page.on('pageerror',e=>failures.push(e.message));
 page.on('response',r=>{if(r.status()>=400)failures.push(r.url()+': '+r.status())});
 for(const route of ['/','/apresentacao/','/apresentacao/index.html','/demo','/demo/','/demo/index.html']){
  const response=await page.goto('http://127.0.0.1:4174'+route);
  assert.equal(response.status(),200,route);
  await page.getByText(route.startsWith('/demo')?'Demonstração · dados 100% fictícios':'Pequenos passos.',{exact:false}).first().waitFor();
 }
 assert.deepEqual(api,[]);assert.deepEqual(failures,[]);
 console.log('6 compiled public routes passed, including trailing slash; no private API calls or failed resources.');
} finally {
 await browser?.close();await server.close();
}
