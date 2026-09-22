import {test,expect} from 'vitest';
import {analyze} from '../src/insights/analyze';
import {journal,care} from './fixtures';
import type {Journal} from '../src/domain/types';
const entries=Array.from({length:7},(_,i)=>journal({id:String(i),localDate:'2026-09-20',feeling:i<3?2:4,tags:i<3?['工作任务','通勤']:[]}));
test('associations count multi-tag records once in overall and link all evidence',()=>{
 const a=analyze({journals:entries,care:[]},'2026-09-22',7);
 expect(a.events[0].mean).toBe(2);expect(a.events[0].overall).toBeCloseTo(22/7);expect(a.events[0].ids).toEqual(['0','1','2']);expect(a.events[0].otherIds).toHaveLength(4);
 expect(a.trend.at(-1)!.mean).toBeNull();
});
test('comparison thresholds require seven total, three tagged, one other',()=>{
 for(const data of [entries.slice(0,6),entries.map((j,i)=>({...j,tags:i<2?['工作任务']:[]})),entries.map(j=>({...j,tags:['工作任务']}))] as Journal[][]) expect(analyze({journals:data,care:[]},'2026-09-22',7).events).toHaveLength(0);
});
test('calendar range includes seventh day, excludes eighth, preserves stored date',()=>{
 const a=analyze({journals:[journal({id:'a',localDate:'2026-09-16'}),journal({id:'b',localDate:'2026-09-15'}),journal({id:'c',localDate:'2026-09-22',feeling:5})],care:[]},'2026-09-22',7);
 expect(a.trend[0].ids).toEqual(['a']);expect(a.trend.at(-1)!.mean).toBe(5);expect(a.trend[1].mean).toBeNull();
});
test('paired feedback includes declines and excludes missing or interrupted scores',()=>{
 const a=analyze({journals:[],care:[care({id:'down',before:4,after:2}),care({id:'missing',after:undefined}),care({id:'interrupted',status:'interrupted'})]},'2026-09-22',7);
 expect(a.feedback[0]).toMatchObject({count:1,meanDelta:-2,declined:1,ids:['down']});
});
test('similar rounded averages are described as close',()=>{
 const data=Array.from({length:100},(_,i)=>journal({id:String(i),feeling:i===99?4:3,tags:i<90?['工作任务']:[]}));
 expect(analyze({journals:data,care:[]},'2026-09-22',7).events[0].relation).toBe('close');
});
