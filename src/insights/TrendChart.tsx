import type {Analysis} from './analyze';
import {dateLabel} from '../domain/dates';
import {feelings} from '../domain/catalog';
export function TrendChart({trend,onSelect}:{trend:Analysis['trend'];onSelect:(ids:string[])=>void}){
 const x=(i:number)=>75+i*775/(trend.length-1),y=(v:number)=>225-(v-1)*46;
 const segments:string[]=[];let current='';trend.forEach((point,i)=>{if(point.mean===null){if(current)segments.push(current);current='';}else current+=`${current?' L':'M'} ${x(i)} ${y(point.mean)}`;});if(current)segments.push(current);
 return <><div className="trend-wrap"><svg className="trend-svg" viewBox="0 0 880 280" role="img" aria-label="每日平均感受趋势，详细数据见下方列表">{feelings.map((label,i)=><g key={label}><text x="0" y={y(i+1)+4}>{label}</text><line x1="75" x2="850" y1={y(i+1)} y2={y(i+1)} stroke="#e4e9df" strokeDasharray="4 5"/></g>)}{segments.map((d,i)=><path key={i} d={d} fill="none" stroke="#5d917e" strokeWidth="2.5" strokeLinejoin="round"/>)}{trend.map((point,i)=><g key={point.date}>{point.mean!==null?<circle cx={x(i)} cy={y(point.mean)} r="5" fill="#fcfdf7" stroke="#5d917e" strokeWidth="2"/>:null}{trend.length===7||i%5===0||i===trend.length-1?<text x={x(i)} y="260" textAnchor="middle">{point.date.slice(5).replace('-','/')}</text>:null}</g>)}</svg></div><details className="chart-data"><summary>查看每日数据与原始记录</summary><div className="daily-data">{trend.map(p=><button key={p.date} disabled={!p.ids.length} onClick={()=>onSelect(p.ids)}>{dateLabel(p.date)}<strong>{p.mean===null?'未记录':p.mean.toFixed(1)}</strong><small>{p.ids.length} 条</small></button>)}</div></details></>;
}
