import type { Emotion, EventTag, CareKind } from './types';
export const emotions: Emotion[] = ['焦虑','烦躁','低落','疲惫','平静','开心','期待','满足'];
export const tags: EventTag[] = ['工作任务','人际沟通','通勤','睡眠','运动','个人生活'];
export const feelings = ['很不好','不太好','一般','比较好','很好'];
export const strengths = ['很轻','较轻','中等','较强','很强'];
export const careNames: Record<CareKind,string> = {breathing:'呼吸练习',sound:'声音陪伴',movement:'轻量活动'};
