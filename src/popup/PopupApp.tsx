import { useState } from "react";
import { Button } from "../components/Button";

export function PopupApp() {
  const [message, setMessage] = useState("");

  async function openSidePanel() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.windowId && chrome.sidePanel?.open) await chrome.sidePanel.open({ windowId: tab.windowId });
    window.close();
  }

  async function suggest() {
    await chrome.runtime.sendMessage({ type: "CLASSIFY_TABS_LOCAL" });
    setMessage("已生成建议，请在侧边栏中确认后应用。");
    await openSidePanel();
  }

  return (
    <main className="popup-shell">
      <h1>Local Tab Organizer</h1>
      <p>使用本地规则和词表整理当前窗口标签页。</p>
      <Button variant="primary" onClick={openSidePanel}>打开侧边栏</Button>
      <Button onClick={suggest}>立即生成分组建议</Button>
      <Button onClick={() => chrome.runtime.openOptionsPage()}>打开设置</Button>
      {message ? <p className="privacy-line">{message}</p> : null}
    </main>
  );
}
