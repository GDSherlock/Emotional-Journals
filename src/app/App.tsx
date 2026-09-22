import {useEffect,useState} from 'react';
import {ArrowRight,Leaf,LockKeyhole} from 'lucide-react';
import {openRepository,type Repository} from '../storage/repository';
import type {Preferences,Space} from '../domain/types';
import {useWorkspace} from './useWorkspace';
import {useRoute,allowLeave,setDirty,navigate} from './router';
import {AppShell} from './AppShell';
import {InsightsPage} from '../insights/InsightsPage';
import {JournalPage} from '../journal/JournalPage';
import {ReviewPage} from '../journal/ReviewPage';
import {StatusMessage,EmptyState} from '../ui/StatusMessage';
function Workspace({repo,prefs,setPrefs}:{repo:Repository;prefs:Preferences;setPrefs:(p:Preferences)=>void}){
 const space=prefs.space!;const route=useRoute();const state=useWorkspace(repo,space);
 async function switchSpace(){if(!allowLeave())return;try{const next={...prefs,space:(space==='personal'?'demo':'personal') as Space};await repo.savePreferences(next);setDirty(false);setPrefs(next);navigate('/record');}catch(e){alert(String(e));}}
 const props={repo,space,snapshot:state.snapshot,refresh:state.refresh};
 return <AppShell space={space} route={route} onSwitch={switchSpace}><StatusMessage error={state.error}/>{state.error?<button onClick={()=>void state.refresh()}>重试读取</button>:state.loading?<p role="status">正在打开你的记录…</p>:route.startsWith('/review')?<ReviewPage key={space+route} {...props} route={route}/>:route==='/insights'?<InsightsPage {...props} prefs={prefs} setPrefs={setPrefs}/>:route==='/record'?<JournalPage {...props}/>:<EmptyState title="页面尚未开放"><a href="#/record">返回记录</a></EmptyState>}</AppShell>;
}
export function App(){
 const [repo,setRepo]=useState<Repository|null>(null),[prefs,setPrefs]=useState<Preferences|null>(null),[error,setError]=useState<string|null>(null),[busy,setBusy]=useState(false);
 useEffect(()=>{let active=true;let connection:Repository|undefined;openRepository(import.meta.env.BASE_URL).then(async value=>{connection=value;const pref=await value.readPreferences();if(active){setRepo(value);setPrefs(pref);}else value.close();}).catch(e=>setError(String(e)));return()=>{active=false;connection?.close();};},[]);
 async function choose(space:Space){if(!repo||!prefs)return;setBusy(true);try{const next={...prefs,space};await repo.savePreferences(next);setPrefs(next);}catch(e){setError(String(e));}finally{setBusy(false);}}
 if(error)return <main className="welcome"><StatusMessage error={error}/><button onClick={()=>location.reload()}>重新打开</button></main>;
 if(!repo||!prefs)return <main className="welcome"><p role="status">正在打开心晴…</p></main>;
 if(!prefs.space)return <main className="welcome"><div className="welcome-brand"><Leaf/> 心晴</div><h1>听见情绪，<br/><span>也听见自己。</span></h1><p className="welcome-intro">给忙碌的生活留一点空白。<br/>记录、理解，然后用一个小行动照顾自己。</p><div className="welcome-choices"><button aria-label="体验示例故事" disabled={busy} className="welcome-choice" onClick={()=>void choose('demo')}><span className="choice-number">01</span><h2>体验示例故事 <ArrowRight/></h2><p>跟随一位职场新人的两周，<br/>看看记录如何变成对自己的理解。</p><small>虚构数据 · 可自由探索</small></button><button aria-label="开始我的记录" disabled={busy} className="welcome-choice personal-choice" onClick={()=>void choose('personal')}><span className="choice-number">02</span><h2>开始我的记录 <ArrowRight/></h2><p>从空白开始，<br/>为此刻的感受写下第一笔。</p><small><LockKeyhole size={13}/> 仅保存在当前浏览器</small></button></div><p className="welcome-note">这是日常自我关怀工具，不能替代专业帮助。</p></main>;
 return <Workspace repo={repo} prefs={prefs} setPrefs={setPrefs}/>;
}
