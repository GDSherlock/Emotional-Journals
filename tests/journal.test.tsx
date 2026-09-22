import { test, expect } from 'vitest';
import {render,screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {JournalForm} from '../src/journal/JournalForm';
import {journal} from './fixtures';
test('failed save preserves the entire journal for retry',async()=>{
 const user=userEvent.setup();
 render(<JournalForm initial={journal()} onSave={async()=>{throw new Error('保存失败');}}/>);
 await user.clear(screen.getByLabelText('一句话日记'));await user.type(screen.getByLabelText('一句话日记'),'今天有点累，想休息');
 await user.click(screen.getByRole('button',{name:'保存记录'}));
 expect(await screen.findByRole('alert')).toHaveTextContent('保存失败');
 expect(screen.getByLabelText('一句话日记')).toHaveValue('今天有点累，想休息');
});
test('double clicking save persists only one record and shows success',async()=>{
 const user=userEvent.setup();let writes=0;
 render(<JournalForm initial={journal()} onSave={async()=>{writes++;await new Promise(r=>setTimeout(r,40));}}/>);
 await user.dblClick(screen.getByRole('button',{name:'保存记录'}));
 expect(await screen.findByText('记录已保存')).toBeVisible();expect(writes).toBe(1);
});
