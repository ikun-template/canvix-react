import type { PluginContext } from '@canvix-react/dock-editor';
import { useChronicleData } from '@canvix-react/toolkit';
import type {
  PropertyGroup,
  PropertyItem,
} from '@canvix-react/widget-registry';
import { useCallback, useSyncExternalStore } from 'react';

interface InspectorProps {
  ctx: PluginContext;
}

export function Inspector({ ctx }: InspectorProps) {
  const snapshot = useSyncExternalStore(
    cb => ctx.editorState.onChange(cb),
    () => ctx.editorState.getSnapshot(),
  );

  const selected = snapshot.selectedWidgetIds;

  if (selected.length === 0) {
    return <div style={{ padding: 12, color: '#999' }}>未选中组件</div>;
  }

  if (selected.length > 1) {
    return (
      <div style={{ padding: 12, color: '#999' }}>
        已选中 {selected.length} 个组件
      </div>
    );
  }

  const widgetId = selected[0];
  const doc = useChronicleData(ctx.chronicle);
  const page = doc.pages.find(p => p.id === snapshot.activePageId);
  if (!page) return null;

  const widget = page.widgets.find(w => w.id === widgetId);
  if (!widget) return null;

  const definition = ctx.registry.get(widget.type);

  return (
    <div style={{ padding: 12 }}>
      <h4 style={{ marginBottom: 8 }}>{widget.name || widget.type}</h4>
      <BaseProperties ctx={ctx} widgetId={widgetId} pageId={page.id} />
      {definition?.inspector && Array.isArray(definition.inspector.render) && (
        <CustomProperties
          ctx={ctx}
          widgetId={widgetId}
          pageId={page.id}
          groups={definition.inspector.render}
        />
      )}
    </div>
  );
}

/* ---------- Base properties ---------- */

function BaseProperties({
  ctx,
  widgetId,
  pageId,
}: {
  ctx: PluginContext;
  widgetId: string;
  pageId: string;
}) {
  const doc = useChronicleData(ctx.chronicle);
  const page = doc.pages.find(p => p.id === pageId);
  const widget = page?.widgets.find(w => w.id === widgetId);
  if (!widget) return null;

  const updateField = useCallback(
    (chain: (string | number)[], value: unknown) => {
      ctx.update({
        target: 'widget',
        pageId,
        id: widgetId,
        operations: [{ kind: 'update', chain, value }],
      });
    },
    [ctx, pageId, widgetId],
  );

  return (
    <fieldset style={fieldsetStyle}>
      <legend style={legendStyle}>基础属性</legend>
      <Row label="X">
        <NumberInput
          value={widget.position.axis[0]}
          onChange={v => updateField(['position', 'axis', 0], v)}
        />
      </Row>
      <Row label="Y">
        <NumberInput
          value={widget.position.axis[1]}
          onChange={v => updateField(['position', 'axis', 1], v)}
        />
      </Row>
      <Row label="宽">
        <NumberInput
          value={widget.layout.size[0]}
          onChange={v => updateField(['layout', 'size', 0], v)}
        />
      </Row>
      <Row label="高">
        <NumberInput
          value={widget.layout.size[1]}
          onChange={v => updateField(['layout', 'size', 1], v)}
        />
      </Row>
      <Row label="旋转">
        <NumberInput
          value={widget.rotation}
          onChange={v => updateField(['rotation'], v)}
        />
      </Row>
      <Row label="透明度">
        <NumberInput
          value={widget.opacity}
          step={0.1}
          min={0}
          max={1}
          onChange={v => updateField(['opacity'], v)}
        />
      </Row>
    </fieldset>
  );
}

/* ---------- Custom properties from WidgetDefinition ---------- */

function CustomProperties({
  ctx,
  widgetId,
  pageId,
  groups,
}: {
  ctx: PluginContext;
  widgetId: string;
  pageId: string;
  groups: PropertyGroup[];
}) {
  const updateField = useCallback(
    (chain: (string | number)[], value: unknown) => {
      ctx.update({
        target: 'widget',
        pageId,
        id: widgetId,
        operations: [{ kind: 'update', chain, value }],
      });
    },
    [ctx, pageId, widgetId],
  );

  const doc = useChronicleData(ctx.chronicle);
  const page = doc.pages.find(p => p.id === pageId);
  const widget = page?.widgets.find(w => w.id === widgetId);
  if (!widget) return null;

  return (
    <>
      {groups.map(group => (
        <fieldset key={group.title} style={fieldsetStyle}>
          <legend style={legendStyle}>{group.title}</legend>
          {group.properties.map(prop => (
            <PropertyRow
              key={prop.chain.join('.')}
              prop={prop}
              widget={widget}
              onChange={updateField}
            />
          ))}
        </fieldset>
      ))}
    </>
  );
}

function PropertyRow({
  prop,
  widget,
  onChange,
}: {
  prop: PropertyItem;
  widget: unknown;
  onChange: (chain: (string | number)[], value: unknown) => void;
}) {
  const value = resolveChain(widget as Record<string, unknown>, prop.chain);

  return (
    <Row label={prop.label}>
      {prop.renderer === 'number' && (
        <NumberInput
          value={value as number}
          onChange={v => onChange(prop.chain, v)}
        />
      )}
      {prop.renderer === 'text' && (
        <input
          type="text"
          value={String(value ?? '')}
          onChange={e => onChange(prop.chain, e.target.value)}
          style={inputStyle}
        />
      )}
      {prop.renderer === 'color' && (
        <input
          type="color"
          value={String(value ?? '#000000')}
          onChange={e => onChange(prop.chain, e.target.value)}
          style={{ ...inputStyle, padding: 2, height: 28 }}
        />
      )}
      {prop.renderer === 'select' && (
        <select
          value={String(value ?? '')}
          onChange={e => onChange(prop.chain, e.target.value)}
          style={inputStyle}
        >
          {((prop.options?.items as string[]) ?? []).map(item => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      )}
    </Row>
  );
}

/* ---------- Primitives ---------- */

function Row({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}
    >
      <span style={{ width: 48, fontSize: 12, color: '#666', flexShrink: 0 }}>
        {label}
      </span>
      {children}
    </div>
  );
}

function NumberInput({
  value,
  onChange,
  step = 1,
  min,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <input
      type="number"
      value={value}
      step={step}
      min={min}
      max={max}
      onChange={e => onChange(Number(e.target.value))}
      style={inputStyle}
    />
  );
}

const fieldsetStyle: React.CSSProperties = {
  border: '1px solid #e0e0e0',
  borderRadius: 4,
  padding: 8,
  marginBottom: 12,
};

const legendStyle: React.CSSProperties = {
  fontSize: 12,
  color: '#888',
};

const inputStyle: React.CSSProperties = {
  flex: 1,
  border: '1px solid #ddd',
  borderRadius: 4,
  padding: '4px 6px',
  fontSize: 12,
  outline: 'none',
};

function resolveChain(
  obj: Record<string, unknown>,
  chain: (string | number)[],
): unknown {
  let current: unknown = obj;
  for (const key of chain) {
    if (current == null) return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}
