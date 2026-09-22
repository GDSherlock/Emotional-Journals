import {useEffect,useRef,useState} from 'react';
import {ArrowRight,Check,LockKeyhole} from 'lucide-react';
import type {Journal,Score,Emotion,EventTag} from '../domain/types';
import {emotions,tags} from '../domain/catalog';
import {datetimeInput,localDateOf} from '../domain/dates';
import {validateJournal} from '../domain/validation';
import {RatingInput} from '../ui/RatingInput';
import {StatusMessage} from '../ui/StatusMessage';
import {setDirty} from '../app/router';
export function JournalForm({initial,onSave}:{initial?:Journal;onSave:(entry:Journal)=>Promise<void>}){
 const [id]=useState(()=>initial?.id??crypto.randomUUID());
 const [occurred,setOccurred]=useState(()=>datetimeInput(initial?new Date(initial.occurredAt):new Date()));
 const [feeling,setFeeling]=useState<Score|undefined>(initial?.feeling),[emotion,setEmotion]=useState<Emotion[]>(initial?.emotions??[]);
 const [strength,setStrength]=useState<Score|undefined>(initial?.intensity),[events,setEvents]=useState<EventTag[]>(initial?.tags??[]);
 const [text,setText]=useState(initial?.text??''),[error,setError]=useState<string|null>(null);
 const [busy,setBusy]=useState(false),[saved,setSaved]=useState(false);const submitting=useRef(false);
 useEffect(()=>()=>setDirty(false),[]);
 async function submit(e:React.FormEvent){e.preventDefault();if(submitting.current)return;setError(null);
  try {const now=new Date();const entry=validateJournal({id,occurredAt:new Date(occurred).toISOString(),localDate:initial&&datetimeInput(new Date(initial.occurredAt))===occurred?initial.localDate:localDateOf(new Date(occurred)),feeling,emotions:emotion,intensity:strength,tags:events,text,createdAt:initial?.createdAt??now.toISOString(),updatedAt:now.toISOString()},now);
   submitting.current=true;setBusy(true);await onSave(entry);setDirty(false);setSaved(true);
  }catch(e){setError(e instanceof Error?e.message:'保存失败，请重试');}finally{submitting.current=false;setBusy(false);}
 }
 if(saved)return <section className="saved panel"><span className="success-mark"><Check/></span><h2>记录已保存</h2><p>谢谢你，愿意停下来听一听自己。</p><div className="actions"><a className="button" href={`#/review/journal/${id}`}>查看记录</a><a className="button primary" href={`#/care?journal=${id}`}>做一个关怀练习 <ArrowRight size={16}/></a></div></section>;
 return <form className="journal-form panel" onSubmit={submit} onChange={()=>{setDirty(true);setError(null);}}>
  <div className="form-top"><span>留一点时间，给此刻的自己</span><input aria-label="发生时间" type="datetime-local" required value={occurred} max={datetimeInput(new Date())} onChange={e=>setOccurred(e.target.value)}/></div>
  <RatingInput label="此刻，你感觉怎么样？" value={feeling} onChange={setFeeling}/>
  <fieldset><legend>哪些情绪正在发生？ <small>可多选</small></legend><div className="chips">{emotions.map(item=><label key={item} className={`chip ${emotion.includes(item)?'selected':''}`}><input type="checkbox" checked={emotion.includes(item)} onChange={()=>setEmotion(emotion.includes(item)?emotion.filter(x=>x!==item):[...emotion,item])}/>{item}</label>)}</div></fieldset>
  <RatingInput label="情绪有多强烈？" intensity value={strength} onChange={setStrength}/>
  <fieldset><legend>和什么有关？ <small>选填 · 可多选</small></legend><div className="chips">{tags.map(item=><label key={item} className={`chip ${events.includes(item)?'selected':''}`}><input type="checkbox" checked={events.includes(item)} onChange={()=>setEvents(events.includes(item)?events.filter(x=>x!==item):[...events,item])}/>{item}</label>)}</div></fieldset>
  <div className="writing"><label htmlFor="journal-text">一句话日记 <small>选填</small></label><textarea id="journal-text" aria-label="一句话日记" rows={4} placeholder="发生了什么？有什么想对自己说的？" value={text} onChange={e=>setText(e.target.value)}/><span className="word-count">{Array.from(text).length} / 5000</span></div>
  <StatusMessage error={error}/><div className="form-bottom"><span><LockKeyhole size={14}/> 只保存在当前浏览器</span><button className="primary" disabled={busy}>{busy?'正在保存…':'保存记录'} <ArrowRight size={16}/></button></div>
 </form>;
}
