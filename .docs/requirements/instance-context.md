# 实例上下文

## 问题

三级实例（Document → Page → Widget）存在天然的父子关系。当 Widget 级别需要执行变更操作时，必须知道自己隶属于哪个 Page；当 Page 级别操作时，Document 是确定的。如果每次操作都要求调用方显式传递上游实例 ID，会导致 API 冗余且容易出错。

---

## 要求

### 层级上下文自动传递

- 每级实例在渲染时，必须向下级自动注入当前实例的上下文信息
- Widget 内部可直接获取所属 Page 的 ID 及相关上下文，无需外部显式传入
- Page 内部可直接获取所属 Document 的上下文

### Toolkit 能力

- 项目对外提供统一的 Toolkit（工具包），基于上下文封装操作能力
- Toolkit 按场景拆分为 editor / viewer 两套导出：
  - **editor**：完整读写能力，供编辑器应用、布局模块、widget 编辑态使用
  - **viewer**：只读能力，供查看器应用、widget 查看态使用
- 各级 Toolkit 自动携带上下文：
  - **Document 级**：直接操作，无需上游上下文。提供文档级能力（页面增删等）
  - **Page 级**：自动携带当前 Page 上下文。提供页面级能力（组件增删、页面属性修改等）
  - **Widget 级**：自动携带当前 Page + Widget 上下文。提供组件级能力（自身属性修改等）
- Widget 开发时需区分编辑态和查看态的 Toolkit 导入

### 上下文不可变性

- 注入的上下文对消费方只读，不可被下游篡改
- 上下文在实例生命周期内保持稳定引用，不因无关变更而导致下游重新渲染

### Toolkit 与 Runtime 的关系

- Dock 内部的 Runtime 是运行时中枢，不直接暴露给外部
- Toolkit 是 Runtime 对外的能力投影，布局模块和 widget 只依赖 Toolkit
- 未来插件扩展 SDK 可基于 Toolkit 二次封装
