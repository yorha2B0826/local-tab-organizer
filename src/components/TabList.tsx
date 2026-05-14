import type { TabInfo } from "../core/types";

export function TabList({ tabs, onRemove }: { tabs: TabInfo[]; onRemove?: (tabId: number) => void }) {
  return (
    <div className="tab-list">
      {tabs.map((tab) => (
        <div className="tab-item" key={tab.id}>
          {tab.favIconUrl ? <img src={tab.favIconUrl} alt="" /> : <span className="favicon-placeholder" />}
          <div className="tab-meta">
            <div className="tab-title" title={tab.title}>{tab.title || "(无标题)"}</div>
            <div className="tab-domain">{tab.domain || "本地页面"}</div>
          </div>
          {onRemove ? <button className="icon-button" title="移除" onClick={() => onRemove(tab.id)}>x</button> : null}
        </div>
      ))}
    </div>
  );
}
