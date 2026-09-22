import {test,expect} from 'vitest';
import {renderHook,act,waitFor} from '@testing-library/react';
import {useWorkspace} from '../src/app/useWorkspace';
import {openRepository} from '../src/storage/repository';
import {journal} from './fixtures';
import type {Snapshot,Space} from '../src/domain/types';
test('late personal read cannot replace current demo state',async()=>{
 const repo=await openRepository('/'+crypto.randomUUID());
 let resolve!:(data:Snapshot)=>void;
 const pending=new Promise<Snapshot>(done=>resolve=done);
 repo.read=async(space)=>space==='personal'?pending:{journals:[journal({id:'demo'})],care:[]};
 const {result,rerender}=renderHook(({space}:{space:Space})=>useWorkspace(repo,space),{initialProps:{space:'personal' as Space}});
 rerender({space:'demo'});
 await waitFor(()=>expect(result.current.snapshot.journals[0]?.id).toBe('demo'));
 await act(async()=>resolve({journals:[journal({id:'personal'})],care:[]}));
 expect(result.current.snapshot.journals[0].id).toBe('demo');
});
