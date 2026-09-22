import type {Snapshot,CareRecord,Score} from '../domain/types';
import {localDateOf} from '../domain/dates';
import {story} from './story';
export function seedDemo(now:Date):Snapshot {
 const journals=story.map(day=>{const date=new Date(now.getFullYear(),now.getMonth(),now.getDate()-15+day.day,18,0,0);const stamp=date.toISOString();return {id:day.id,occurredAt:stamp,localDate:localDateOf(date),feeling:day.feeling,emotions:[...day.emotions],intensity:3 as Score,tags:[...day.tags],text:day.text,createdAt:stamp,updatedAt:stamp};});
 const feedback:[number,CareRecord['kind'],Score,Score][]=[[8,'breathing',2,3],[10,'sound',3,3],[12,'movement',3,2]];
 const care=feedback.map(([day,kind,before,after])=>{const j=journals[day-1];return {id:`demo-care-${day}`,kind,before,after,status:'completed' as const,journalId:j.id,startedAt:j.occurredAt,endedAt:new Date(Date.parse(j.occurredAt)+180000).toISOString(),endDate:j.localDate};});
 return {journals,care};
}
