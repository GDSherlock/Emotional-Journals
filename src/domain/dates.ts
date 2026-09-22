export function localDateOf(date: Date): string {
 return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
}
export function dateWindow(endDate: string, days: 7 | 30): string[] {
 const [y,m,d]=endDate.split('-').map(Number);
 return Array.from({length:days},(_,i)=>new Date(Date.UTC(y,m-1,d-days+1+i)).toISOString().slice(0,10));
}
export const dateLabel = (value: string) => value.slice(5).replace('-', '月')+'日';
export function datetimeInput(date: Date): string { return `${localDateOf(date)}T${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`; }
