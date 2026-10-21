import {test} from 'node:test';
import assert from 'node:assert/strict';
import {SKIP_STAMINA_COST,spendResource,recoverStamina} from '../src/playerResources.ts';
import {Duel} from '../src/duel.ts';

test('skip attempts deplete stamina and resting restores it without overflow',()=>{
 let stamina=1;
 stamina=spendResource(stamina,SKIP_STAMINA_COST);
 assert.equal(stamina,.78);
 for(let i=0;i<4;i++)stamina=spendResource(stamina,SKIP_STAMINA_COST);
 assert.equal(stamina,0);
 assert.ok(Math.abs(recoverStamina(stamina,5)-.45)<1e-8);
 assert.equal(recoverStamina(stamina,30),1);
});
test('mimic damage carries into the next duel and three hits reach exact zero',()=>{
 let health=spendResource(1,1/3);
 const duel=new Duel();duel.start(health*3);
 assert.equal(duel.lives,2);
 health=spendResource(health,1/3);duel.start(health*3);
 assert.equal(duel.lives,1);
 assert.equal(duel.advance(duel.impactDelay),'lost');
 assert.equal(duel.lives,0);
 assert.equal(spendResource(health,1/3),0);
});
