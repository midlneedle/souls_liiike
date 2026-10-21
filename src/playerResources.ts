export const SKIP_STAMINA_COST=.22;
export const STAMINA_RECOVERY_DELAY=1.6;
export const STAMINA_RECOVERY_RATE=.09;
export function spendResource(value:number,cost:number){const remaining=Math.max(0,Math.min(1,value-cost));return remaining<1e-8?0:remaining;}
export function recoverStamina(value:number,seconds:number){return Math.min(1,value+Math.max(0,seconds)*STAMINA_RECOVERY_RATE);}
