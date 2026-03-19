import type { PluginContext } from '@canvix-react/dock-editor';
import { PiColor, PiNumber, PiText } from '@canvix-react/inspector-controls';
import type { OperationModel } from '@canvix-react/toolkit-editor';
import { PageLiveProvider, usePageLive } from '@canvix-react/toolkit-shared';
import { FieldGroup } from '@canvix-react/ui-inspector';
import { useCallback } from 'react';

interface InspectorPageProps {
  ctx: PluginContext;
  pageId: string;
}

export function InspectorPage({ ctx, pageId }: InspectorPageProps) {
  const subscribePage = useCallback(
    (cb: () => void) =>
      ctx.chronicle.onUpdate((model: OperationModel) => {
        if (model.target === 'page' && model.id === pageId) cb();
      }),
    [ctx.chronicle, pageId],
  );

  return (
    <PageLiveProvider pageId={pageId} subscribe={subscribePage}>
      <InspectorPageContent ctx={ctx} pageId={pageId} />
    </PageLiveProvider>
  );
}

function InspectorPageContent({
  ctx,
  pageId,
}: {
  ctx: PluginContext;
  pageId: string;
}) {
  const page = usePageLive();

  const updateField = useCallback(
    (chain: (string | number)[], value: unknown) => {
      ctx.update({
        target: 'page',
        id: pageId,
        operations: [{ kind: 'update', chain, value }],
      });
    },
    [ctx, pageId],
  );

  return (
    <div className="p-3">
      <h4 className="mb-2 text-sm font-medium">页面属性</h4>

      <div className="mb-3">
        <PiText
          label="名称"
          value={page.name}
          onChange={v => updateField(['name'], v)}
        />
      </div>

      <FieldGroup title="尺寸">
        <div className="flex gap-1">
          <div className="flex-1">
            <PiNumber
              label="宽"
              value={page.layout.size[0]}
              onChange={v => updateField(['layout', 'size', 0], v)}
              min={1}
            />
          </div>
          <div className="flex-1">
            <PiNumber
              label="高"
              value={page.layout.size[1]}
              onChange={v => updateField(['layout', 'size', 1], v)}
              min={1}
            />
          </div>
        </div>
      </FieldGroup>

      <FieldGroup title="颜色">
        <div className="flex flex-col gap-1.5">
          <PiColor
            label="背景"
            value={page.background}
            onChange={v => updateField(['background'], v)}
          />
          <PiColor
            label="前景"
            value={page.foreground}
            onChange={v => updateField(['foreground'], v)}
          />
        </div>
      </FieldGroup>
    </div>
  );
}
