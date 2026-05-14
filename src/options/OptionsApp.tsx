import { useEffect, useState } from "react";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { RuleEditor } from "../components/RuleEditor";
import { TextInput } from "../components/TextInput";
import { Toggle } from "../components/Toggle";
import { DEFAULT_SETTINGS } from "../core/constants";
import type { Settings, UserRule } from "../core/types";

type Response<T> = { ok: true; data: T } | { ok: false; error: string };
async function send<T>(message: unknown): Promise<T> {
  const response = await chrome.runtime.sendMessage(message) as Response<T>;
  if (!response.ok) throw new Error(response.error);
  return response.data;
}

function newRule(): UserRule {
  return { id: crypto.randomUUID(), type: "domain", pattern: "", groupName: "", enabled: true };
}

export function OptionsApp() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [importText, setImportText] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    send<Settings>({ type: "GET_SETTINGS" }).then(setSettings).catch((error) => setNotice(error.message));
  }, []);

  async function save() {
    setSettings(await send<Settings>({ type: "SAVE_SETTINGS", settings }));
    setNotice("保存成功");
  }

  async function doExport() {
    setImportText(await send<string>({ type: "EXPORT_SETTINGS" }));
    setNotice("设置已导出到文本框");
  }

  async function doImport() {
    setSettings(await send<Settings>({ type: "IMPORT_SETTINGS", json: importText }));
    setNotice("导入成功");
  }

  async function doReset() {
    setSettings(await send<Settings>({ type: "RESET_SETTINGS" }));
    setNotice("已重置设置");
  }

  return (
    <main className="options-shell">
      <header className="hero">
        <h1>Local Tab Organizer 设置</h1>
        <p>本扩展不接入任何远程 AI API，不上传标签页数据，所有分类逻辑均在浏览器本地完成。</p>
      </header>
      <Card>
        <h2>分类设置</h2>
        <label>最大分组数<TextInput type="number" value={settings.maxGroups} onChange={(event) => setSettings({ ...settings, maxGroups: Number(event.target.value) })} /></label>
        <label>最小成组标签数<TextInput type="number" value={settings.minTabsPerGroup} onChange={(event) => setSettings({ ...settings, minTabsPerGroup: Number(event.target.value) })} /></label>
        <Toggle label="应用后自动折叠" checked={settings.autoCollapseAfterApply} onChange={(value) => setSettings({ ...settings, autoCollapseAfterApply: value })} />
        <Toggle label="包含固定标签页" checked={settings.includePinnedTabs} onChange={(value) => setSettings({ ...settings, includePinnedTabs: value })} />
        <Toggle label="启用 Chrome 内置 Gemini Nano 本地增强" checked={settings.enableGeminiNanoEnhancement} onChange={(value) => setSettings({ ...settings, enableGeminiNanoEnhancement: value })} />
        <p className="privacy-line">该增强模式仅调用 Chrome 浏览器内置本地模型，无需密钥，也不会连接远程模型服务。若当前 Chrome 不支持，会自动使用普通本地分类。</p>
      </Card>
      <Card>
        <div className="section-header">
          <h2>规则管理</h2>
          <Button onClick={() => setSettings({ ...settings, rules: [...settings.rules, newRule()] })}>添加规则</Button>
        </div>
        {settings.rules.map((rule) => (
          <RuleEditor
            key={rule.id}
            rule={rule}
            onChange={(next) => setSettings({ ...settings, rules: settings.rules.map((item) => item.id === rule.id ? next : item) })}
            onDelete={() => setSettings({ ...settings, rules: settings.rules.filter((item) => item.id !== rule.id) })}
          />
        ))}
      </Card>
      <Card>
        <h2>设置导入导出</h2>
        <textarea className="textarea" value={importText} onChange={(event) => setImportText(event.target.value)} />
        <div className="actions">
          <Button onClick={doExport}>导出设置</Button>
          <Button onClick={doImport}>导入设置</Button>
          <Button variant="danger" onClick={doReset}>重置设置</Button>
        </div>
      </Card>
      <div className="actions sticky-save">
        <Button variant="primary" onClick={save}>保存按钮</Button>
        {notice ? <span>{notice}</span> : null}
      </div>
    </main>
  );
}
