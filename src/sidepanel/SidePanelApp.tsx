import { useEffect, useMemo, useState } from "react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { GroupSuggestionEditor } from "../components/GroupSuggestionEditor";
import { TabList } from "../components/TabList";
import { WarningList } from "../components/WarningList";
import { DEFAULT_SETTINGS } from "../core/constants";
import type { ClassificationResult, Settings, TabGroupSuggestion, TabInfo } from "../core/types";

type Response<T> = { ok: true; data: T } | { ok: false; error: string };

async function send<T>(message: unknown): Promise<T> {
  const response = await chrome.runtime.sendMessage(message) as Response<T>;
  if (!response.ok) throw new Error(response.error);
  return response.data;
}

export function SidePanelApp() {
  const [tabs, setTabs] = useState<TabInfo[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [result, setResult] = useState<ClassificationResult | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const byId = useMemo(() => new Map(tabs.map((tab) => [tab.id, tab])), [tabs]);
  const ungroupedTabs = (result?.ungroupedTabIds ?? []).map((id) => byId.get(id)).filter((tab): tab is TabInfo => Boolean(tab));

  async function run(action: () => Promise<void>) {
    setLoading(true);
    setError("");
    try {
      await action();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "操作失败");
    } finally {
      setLoading(false);
    }
  }

  const refresh = () => run(async () => {
    const nextSettings = await send<Settings>({ type: "GET_SETTINGS" });
    const nextTabs = await send<TabInfo[]>({ type: "GET_TABS" });
    setSettings(nextSettings);
    setTabs(nextTabs);
  });

  useEffect(() => {
    refresh();
  }, []);

  const classify = () => run(async () => {
    const data = await send<{ tabs: TabInfo[]; result: ClassificationResult }>({ type: "CLASSIFY_TABS_LOCAL" });
    setTabs(data.tabs);
    setResult(data.result);
    setWarnings(data.result.warnings);
  });

  const updateGroup = (group: TabGroupSuggestion) => {
    if (!result) return;
    setResult({ ...result, groups: result.groups.map((item) => item.id === group.id ? group : item) });
  };

  const applyGroups = () => run(async () => {
    if (!result) return;
    const applied = await send<{ warnings: string[] }>({ type: "APPLY_GROUPS", groups: result.groups, settings });
    setWarnings(applied.warnings);
  });

  return (
    <main className="app-shell">
      <header className="hero">
        <h1>Local Tab Organizer</h1>
        <p>纯本地标签页智能整理</p>
      </header>

      <Card>
        <div className="stats">
          <span>可整理 {tabs.length}</span>
          <span>建议 {result?.groups.length ?? 0}</span>
          <span>未分组 {result?.ungroupedTabIds.length ?? tabs.length}</span>
        </div>
        <p className="privacy-line">所有分类均在本地完成，不会发送标签页数据。</p>
      </Card>

      <div className="actions">
        <Button disabled={loading} onClick={refresh}>刷新标签页</Button>
        <Button variant="primary" disabled={loading || tabs.length === 0} onClick={classify}>{loading ? "处理中..." : "本地智能整理"}</Button>
        <Button disabled={loading || !result?.groups.length} onClick={applyGroups}>应用分组</Button>
        <Button disabled={loading} onClick={() => run(() => send({ type: "COLLAPSE_ALL" }))}>折叠全部分组</Button>
        <Button disabled={loading} onClick={() => run(() => send({ type: "EXPAND_ALL" }))}>展开全部分组</Button>
        <Button variant="danger" disabled={loading} onClick={() => run(() => send({ type: "UNGROUP_ALL" }))}>取消全部分组</Button>
      </div>

      {error ? <div className="error-block">{error}</div> : null}
      <WarningList warnings={warnings} />
      {tabs.length === 0 ? <Card><p>当前窗口没有可整理的标签页。</p></Card> : null}

      {result?.groups.map((group) => (
        <GroupSuggestionEditor
          key={group.id}
          group={group}
          tabs={group.tabIds.map((id) => byId.get(id)).filter((tab): tab is TabInfo => Boolean(tab))}
          onChange={updateGroup}
          onDelete={() => setResult({ ...result, groups: result.groups.filter((item) => item.id !== group.id), ungroupedTabIds: [...new Set([...result.ungroupedTabIds, ...group.tabIds])] })}
          onRemoveTab={(tabId) => updateGroup({ ...group, tabIds: group.tabIds.filter((id) => id !== tabId) })}
        />
      ))}

      {ungroupedTabs.length > 0 ? (
        <Card>
          <h2>未分组标签</h2>
          <TabList tabs={ungroupedTabs} />
        </Card>
      ) : null}
    </main>
  );
}
