import {test,expect} from 'vitest';
import {seedDemo} from '../src/demo/seed';
import {story} from '../src/demo/story';
import {aiExample} from '../src/demo/aiExample';
import {analyze} from '../src/insights/analyze';
import {validateJournal,validateCare} from '../src/domain/validation';
test('two-week example has real valid records, relevant associations and all feedback directions',()=>{
 const now=new Date('2026-09-22T12:00:00+08:00'),s=seedDemo(now);
 expect(s.journals).toHaveLength(14);expect(s.journals[0].localDate).toBe('2026-09-08');expect(s.journals.at(-1)!.localDate).toBe('2026-09-21');
 s.journals.forEach(j=>validateJournal(j,now));s.care.forEach(c=>validateCare(c,now));
 const a=analyze(s,'2026-09-22',30);expect(a.events.length).toBeGreaterThan(0);expect(a.feedback.map(f=>f.meanDelta)).toEqual([1,0,-1]);
});
test('changing or removing demo copies leaves fixed AI references intact',()=>{
 expect(aiExample.observations.length).toBeGreaterThan(0);
 const original=JSON.stringify(story),s=seedDemo(new Date('2026-03-02T12:00:00+08:00'));
 s.journals[0].text='修改';s.journals=[];expect(JSON.stringify(story)).toBe(original);
 for(const observation of aiExample.observations)expect(observation.storyIds.every(id=>story.some(day=>day.id===id))).toBe(true);
 expect(seedDemo(new Date('2026-03-02T12:00:00+08:00')).journals.at(-1)!.localDate).toBe('2026-03-01');
});
