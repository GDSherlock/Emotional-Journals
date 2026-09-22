import type {Repository} from '../storage/repository';
import type {Snapshot,Space} from '../domain/types';
import {JournalForm} from './JournalForm';
import {PageHeading} from '../ui/StatusMessage';
import {Leaf,Quote} from 'lucide-react';
export interface PageProps {repo:Repository;space:Space;snapshot:Snapshot;refresh:()=>Promise<void>}
export function JournalPage({repo,space,refresh}:PageProps){return <><PageHeading title="给情绪，一个停靠的地方" description="不必组织好语言，也不必急着变好。从记录此刻开始。"/><div className="journal-layout"><JournalForm key={space} onSave={async entry=>{await repo.saveJournal(space,entry);await refresh();}}/><aside className="journal-aside"><div className="aside-quote"><Quote size={25}/><h2>每一种感受，<br/>都值得被看见。</h2><p>情绪没有标准答案。<br/>你可以开心，也可以疲惫，<br/>或是说不清楚的两者都有。</p><Leaf className="aside-leaf" size={80} strokeWidth={.7}/></div><div className="gentle-note"><span>一个小提醒</span><p>先描述发生了什么，再试着命名你的感受。不评价，也不着急寻找原因。</p></div><a className="text-link" href="#/review">看看过去的自己 <span>↗</span></a></aside></div></>;}
