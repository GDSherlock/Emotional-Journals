import { test, expect } from 'vitest';
import { validateJournal, validateCare } from '../src/domain/validation';
import { journal, care } from './fixtures';
const now = new Date('2026-09-22T12:00:00Z');
test('valid journal retains literal markup and saved calendar date', () => {
 const value=journal({text:'<img src=x onerror=alert(1)>',localDate:'2026-09-19'});
 expect(validateJournal(value,now)).toEqual(value);
});
test('rejects invalid ratings, future dates, missing emotions, duplicates and oversized text', () => {
 for (const change of [{feeling:0},{intensity:6},{emotions:[]},{tags:['睡眠','睡眠']},{localDate:'2026-02-30'},{occurredAt:'2027-01-01T00:00:00Z'},{text:'字'.repeat(5001)}]) expect(()=>validateJournal({...journal(),...change},now)).toThrow();
 expect(validateJournal(journal({text:'😀'.repeat(5000)}),now).text).toHaveLength(10000);
});
test('care requires legitimate chronology and optional scores', () => {
 expect(validateCare(care({after:undefined}),now).after).toBeUndefined();
 for(const change of [{endedAt:'2026-09-19T00:00:00Z'},{endedAt:undefined},{after:7},{status:'interrupted',after:4}]) expect(()=>validateCare({...care(),...change},now)).toThrow();
});
