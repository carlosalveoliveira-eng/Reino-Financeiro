import {test,expect} from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import {mkdir} from 'node:fs/promises';

test.beforeEach(async({page})=>{await page.clock.install({time:new Date('2026-09-30T16:00:00Z')});await mkdir('docs/screenshots',{recursive:true})});
test('public presentation is accessible at desktop and mobile widths',async({page})=>{
 await page.goto('/');await expect(page.getByRole('heading',{level:1})).toContainText('Pequenos passos');
 await page.screenshot({path:'docs/screenshots/apresentacao-desktop.png',fullPage:true});
 expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 await page.screenshot({path:'docs/screenshots/apresentacao-mobile.png',fullPage:true});
});
test('demo navigation, recurrence form and invoice status never contact finance API',async({page})=>{
 const requests:string[]=[];const errors:string[]=[];page.on('request',r=>{if(r.url().includes('/api/finance'))requests.push(r.url())});page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/demo');await expect(page.getByText('Demonstração · dados 100% fictícios')).toBeVisible();await page.waitForLoadState('networkidle');
 await page.screenshot({path:'docs/screenshots/dashboard-desktop.png',fullPage:true});
 expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations).toEqual([]);
 await page.getByRole('button',{name:'Cartões',exact:true}).click();await expect(page.getByText('Fechada',{exact:true}).first()).toBeVisible();
 await page.screenshot({path:'docs/screenshots/faturas-desktop.png',fullPage:true});
 await page.getByRole('button',{name:'Recorrências',exact:true}).click();await expect(page.getByRole('columnheader',{name:'Data final'})).toBeVisible();
 await page.getByRole('button',{name:'Editar recorrência'}).last().click();await expect(page.getByLabel('Data final (opcional, inclusive)')).toHaveValue('2027-02-06');await page.getByRole('button',{name:'Cancelar',exact:true}).click();
 await page.getByRole('button',{name:'Metas',exact:true}).click();await expect(page.getByText('Simule o ritmo da sua meta')).toBeVisible();
 await page.getByLabel('Reserva mensal (R$)').fill('500,00');await expect(page.getByText('23 meses no ritmo informado')).toBeVisible();
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:'docs/screenshots/metas-mobile.png',fullPage:true});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBe(true);
 expect(requests).toEqual([]);expect(errors).toEqual([]);
});
test('invoice status updates at midnight while financial amounts stay unchanged',async({page})=>{
 await page.clock.setSystemTime(new Date('2026-09-30T03:00:00Z'));await page.goto('/demo');
 await page.getByRole('button',{name:'Cartões',exact:true}).click();await expect(page.locator('.invoice-row .tag')).toHaveText('Fecha hoje');
 await page.clock.pauseAt(new Date('2026-09-30T03:59:59Z'));const amounts=await page.locator('.large-value').allTextContents();
 await page.clock.runFor(2000);await expect(page.locator('.invoice-row .tag')).toHaveText('Fechada');
 expect(await page.locator('.large-value').allTextContents()).toEqual(amounts);
});
test('all demo sections fit desktop and mobile and mobile menu supports keyboard',async({page})=>{
 test.setTimeout(120000);
 await page.goto('/demo');await expect(page.getByText('Demonstração · dados 100% fictícios')).toBeVisible();
 for(const name of ['Movimentações','Minhas contas','Cartões','Orçamentos','Metas','Investimentos','Dívidas','Projeção de saldo','Recorrências','Relatórios','Minha jornada','Importar extrato','Guia financeiro','Agenda e lembretes','Configurações']){
  await page.getByRole('button',{name,exact:true}).click();
  expect((await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze()).violations, name).toEqual([]);
  await page.setViewportSize({width:390,height:844});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),name).toBe(true);await page.setViewportSize({width:1440,height:1000});
 }
 await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Toggle Sidebar'}).click();await expect(page.getByRole('button',{name:'Cartões',exact:true})).toBeVisible();await page.keyboard.press('Escape');await expect(page.getByRole('button',{name:'Cartões',exact:true})).not.toBeVisible();
});
