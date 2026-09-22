import { Sparkles, ArrowLeft, Quote } from "lucide-react";
import { PageHeading } from "../ui/StatusMessage";
import { aiExample } from "./aiExample";
import { story } from "./story";
export function AiExamplePage() {
  return (
    <>
      <a href="#/insights" className="back">
        <ArrowLeft size={15} /> 返回洞察
      </a>
      <PageHeading
        title="换一个角度，读懂那些日子"
        description="以一位职场新人的两周日记为例，看看解读可以如何帮助反思。"
      />
      <div className="ai-notice" role="note">
        <Sparkles size={19} />
        <div>
          <strong>AI 解读示例 · 预设内容，非实时生成</strong>
          <p>
            下面展示虚构日记的预设解读，不会分析或发送你的日记。引用的是固定故事，不受示例空间中的编辑影响。
          </p>
        </div>
      </div>
      <div className="ai-content">
        <section>
          <span className="section-number">01</span>
          <h2>记录里的线索</h2>
          {aiExample.observations.map((o, i) => (
            <article className="panel ai-observation" key={i}>
              <p>{o.text}</p>
              <details>
                <summary>查看引用的虚构日记</summary>
                <ul className="evidence">
                  {o.storyIds.map((id) => {
                    const day = story.find((d) => d.id === id)!;
                    return (
                      <li key={id}>
                        <span>
                          第 {day.day} 天 · 感受 {day.feeling} / 5 ·{" "}
                          {day.tags.join("、")}
                        </span>
                        <p>{day.text}</p>
                      </li>
                    );
                  })}
                </ul>
              </details>
            </article>
          ))}
        </section>
        <section>
          <span className="section-number">02</span>
          <h2>一种可能的理解</h2>
          <p className="interpretation">{aiExample.interpretation}</p>
        </section>
        <section className="reflection">
          <Quote size={24} />
          <h2>留给自己的一个问题</h2>
          <p>{aiExample.question}</p>
          <a className="button" href="#/record">
            带着这个问题，写一条记录
          </a>
        </section>
      </div>
    </>
  );
}
