import {writeFileSync,mkdirSync} from 'node:fs';
const rate=22050,count=rate*30,data=Buffer.alloc(44+count*2);let seed=20260922,filtered=0;
data.write('RIFF');data.writeUInt32LE(36+count*2,4);data.write('WAVE',8);data.write('fmt ',12);data.writeUInt32LE(16,16);data.writeUInt16LE(1,20);data.writeUInt16LE(1,22);data.writeUInt32LE(rate,24);data.writeUInt32LE(rate*2,28);data.writeUInt16LE(2,32);data.writeUInt16LE(16,34);data.write('data',36);data.writeUInt32LE(count*2,40);
for(let i=0;i<count;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const white=seed/4294967296*2-1;filtered=.97*filtered+.03*white;const fade=Math.min(1,i/(rate*.08),(count-1-i)/(rate*.08));const sample=Math.max(-1,Math.min(1,(filtered*4+white*.12)*.35))*fade;data.writeInt16LE(Math.round(sample*32767),44+i*2);}
mkdirSync('public/audio',{recursive:true});writeFileSync('public/audio/rain.wav',data);
