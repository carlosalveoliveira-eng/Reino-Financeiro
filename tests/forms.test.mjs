import test from 'node:test';
import assert from 'node:assert/strict';
import {formCommand} from '../.sites-runtime/form-build/domain/form-command.js';
const id='11111111-1111-4111-8111-111111111111';
const base={operationKey:id,name:'Aluguel fictício',amount:'123,45',date:'2026-09-30',kind:'expense',category:'Moradia',accountId:id};
test('recurrence form supports optional end date, precise cents and stable editing id',()=>{
 const c=formCommand('recurring',{...base,editingId:id,endDate:'2027-01-31'});
 assert.equal(c.action,'update');assert.equal(c.id,id);assert.equal(c.record.amount,12345);assert.equal(c.record.endDate,'2027-01-31');
 assert.equal(formCommand('recurring',{...base,endDate:''}).record.endDate,undefined);
 assert.throws(()=>formCommand('recurring',{...base,endDate:'2026-02-30'}));
});
test('form rejects missing references, invalid cents and invalid card limits',()=>{
 assert.throws(()=>formCommand('recurring',{...base,accountId:''}));
 assert.throws(()=>formCommand('recurring',{...base,amount:'1.234'}));
 assert.throws(()=>formCommand('card',{...base,limit:'100',closing:'32',due:'7'}));
});
test('planned future dates and negative reconciliation keep their financial meaning',()=>{
 assert.equal(formCommand('transaction',{...base,date:'2099-01-01',status:'posted'}).record.status,'planned');
 assert.equal(formCommand('reconcile',{...base,id,balance:'-15,01'}).balance,-1501);
});
