import { CHROME_GROUP_COLORS } from "../core/constants";
import type { TabGroupSuggestion, TabInfo } from "../core/types";
import { Button } from "./Button";
import { Card } from "./Card";
import { Select } from "./Select";
import { TabList } from "./TabList";
import { TextInput } from "./TextInput";

export function GroupSuggestionEditor({
  group,
  tabs,
  onChange,
  onDelete,
  onRemoveTab
}: {
  group: TabGroupSuggestion;
  tabs: TabInfo[];
  onChange: (group: TabGroupSuggestion) => void;
  onDelete: () => void;
  onRemoveTab: (tabId: number) => void;
}) {
  return (
    <Card className="group-editor">
      <div className="group-editor-header">
        <TextInput value={group.name} onChange={(event) => onChange({ ...group, name: event.target.value })} />
        <Select value={group.color} onChange={(event) => onChange({ ...group, color: event.target.value as TabGroupSuggestion["color"] })}>
          {CHROME_GROUP_COLORS.map((color) => <option key={color} value={color}>{color}</option>)}
        </Select>
        <Button variant="danger" onClick={onDelete}>删除</Button>
      </div>
      <div className="group-reason">
        <span>置信度 {Math.round(group.confidence * 100)}%</span>
        <span>{group.reason}</span>
      </div>
      <TabList tabs={tabs} onRemove={onRemoveTab} />
    </Card>
  );
}
