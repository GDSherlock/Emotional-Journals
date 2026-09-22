import type {Snapshot,EventTag,CareKind} from '../domain/types';
import {dateWindow} from '../domain/dates';
import {tags} from '../domain/catalog';
export interface Analysis {
 trend:{date:string;mean:number|null;ids:string[]}[];
 events:{tag:EventTag;mean:number;overall:number;relation:'higher'|'lower'|'close';ids:string[];otherIds:string[]}[];
 feedback:{kind:CareKind;count:number;meanDelta:number;improved:number;unchanged:number;declined:number;ids:string[]}[];
}
const average=(values:number[])=>values.reduce((a,b)=>a+b,0)/values.length;
export function analyze(snapshot:Snapshot,end:string,days:7|30):Analysis {
 const dates=dateWindow(end,days),journals=snapshot.journals.filter(j=>dates.includes(j.localDate));
 const trend=dates.map(date=>{const group=journals.filter(j=>j.localDate===date);return {date,mean:group.length?average(group.map(j=>j.feeling)):null,ids:group.map(j=>j.id)};});
 const events:Analysis['events']=[];
 if(journals.length>=7){const overall=average(journals.map(j=>j.feeling));for(const tag of tags){const group=journals.filter(j=>j.tags.includes(tag)),other=journals.filter(j=>!j.tags.includes(tag));if(group.length<3||!other.length)continue;const mean=average(group.map(j=>j.feeling)),a=mean.toFixed(1),b=overall.toFixed(1);events.push({tag,mean,overall,relation:a===b?'close':mean>overall?'higher':'lower',ids:group.map(j=>j.id),otherIds:other.map(j=>j.id)});}}
 const paired=snapshot.care.filter(c=>c.status==='completed'&&c.before!==undefined&&c.after!==undefined&&c.endDate!==undefined&&dates.includes(c.endDate));
 const feedback:Analysis['feedback']=[];
 for(const kind of ['breathing','sound','movement'] as const){const group=paired.filter(c=>c.kind===kind);if(!group.length)continue;const deltas=group.map(c=>c.after!-c.before!);feedback.push({kind,count:group.length,meanDelta:average(deltas),improved:deltas.filter(d=>d>0).length,unchanged:deltas.filter(d=>d===0).length,declined:deltas.filter(d=>d<0).length,ids:group.map(c=>c.id)});}
 return {trend,events,feedback};
}
