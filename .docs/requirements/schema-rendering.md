# Schema 驱动渲染

## 核心原则

UI = f(schema)。所有 UI 渲染由 Schema 数据驱动，禁止 UI 组件自持业务状态。

---

## 要求

- 所有 Schema 变更通过 Operation 描述，Operation 需精确指明变更的目标层级（document / page / widget）、目标实例 ID、变更字段路径及新值
- 字段路径（chain）为路径数组，精确定位到 Schema 中的任意嵌套字段
- 渲染层必须根据 Operation 中的字段路径做最小粒度响应，仅更新受影响的部分
- 提供字段变更检测能力，各消费方可按需判断某个 Operation 是否影响自己关心的字段，从而决定是否响应
- 组件的自定义数据（custom_data）变更需透传到组件内部，由组件自行决定渲染更新
