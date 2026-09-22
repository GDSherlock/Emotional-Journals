import { test, expect } from 'vitest';
import { dateWindow, localDateOf } from '../src/domain/dates';
test('calendar window crosses month and leap day without elapsed-hour drift', () => {
 expect(dateWindow('2026-03-02',7)).toEqual(['2026-02-24','2026-02-25','2026-02-26','2026-02-27','2026-02-28','2026-03-01','2026-03-02']);
 expect(dateWindow('2024-03-01',7)).toContain('2024-02-29');
 expect(dateWindow('2026-01-02',7)[0]).toBe('2025-12-27');
 expect(localDateOf(new Date(2026,8,22,0,1))).toBe('2026-09-22');
});
