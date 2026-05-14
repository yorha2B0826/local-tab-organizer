import { CHROME_GROUP_COLORS } from "../core/constants";
import type { UserRule } from "../core/types";
import { Button } from "./Button";
import { Select } from "./Select";
import { TextInput } from "./TextInput";

export function RuleEditor({ rule, onChange, onDelete }: { rule: UserRule; onChange: (rule: UserRule) => void; onDelete: () => void }) {
  return (
    <div className="rule-editor">
      <label className="inline-check">
        <input type="checkbox" checked={rule.enabled} onChange={(event) => onChange({ ...rule, enabled: event.target.checked })} />
        启用
      </label>
      <Select value={rule.type} onChange={(event) => onChange({ ...rule, type: event.target.value as UserRule["type"] })}>
        <option value="domain">domain</option>
        <option value="domainSuffix">domainSuffix</option>
        <option value="keyword">keyword</option>
        <option value="urlRegex">urlRegex</option>
        <option value="titleRegex">titleRegex</option>
      </Select>
      <TextInput placeholder="pattern" value={rule.pattern} onChange={(event) => onChange({ ...rule, pattern: event.target.value })} />
      <TextInput placeholder="groupName" value={rule.groupName} onChange={(event) => onChange({ ...rule, groupName: event.target.value })} />
      <Select value={rule.color ?? ""} onChange={(event) => onChange({ ...rule, color: event.target.value ? event.target.value as UserRule["color"] : undefined })}>
        <option value="">自动颜色</option>
        {CHROME_GROUP_COLORS.map((color) => <option key={color} value={color}>{color}</option>)}
      </Select>
      <Button variant="danger" onClick={onDelete}>删除</Button>
    </div>
  );
}
