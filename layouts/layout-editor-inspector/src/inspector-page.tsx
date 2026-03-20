import type { PluginContext } from '@canvix-react/dock-editor';
import { useI18n } from '@canvix-react/i18n';
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
  const { t } = useI18n();
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
    <div className="flex h-full flex-col">
      <div className="border-border flex h-9 shrink-0 items-center border-b px-3">
        <h4 className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
          {t('inspector.page')}
        </h4>
      </div>
      <div className="overflow-y-auto px-3 py-2">
        <div className="mb-3">
          <PiText
            label={t('inspector.name')}
            value={page.name}
            onChange={v => updateField(['name'], v)}
          />
        </div>

        <FieldGroup title={t('inspector.size')}>
          <div className="flex gap-1">
            <div className="flex-1">
              <PiNumber
                label={t('inspector.size.width')}
                value={page.layout.size[0]}
                onChange={v => updateField(['layout', 'size', 0], v)}
                min={1}
              />
            </div>
            <div className="flex-1">
              <PiNumber
                label={t('inspector.size.height')}
                value={page.layout.size[1]}
                onChange={v => updateField(['layout', 'size', 1], v)}
                min={1}
              />
            </div>
          </div>
        </FieldGroup>

        <FieldGroup title={t('inspector.color')}>
          <div className="flex flex-col gap-1.5">
            <PiColor
              label={t('inspector.color.background')}
              value={page.background}
              onChange={v => updateField(['background'], v)}
            />
            <PiColor
              label={t('inspector.color.foreground')}
              value={page.foreground}
              onChange={v => updateField(['foreground'], v)}
            />
          </div>
        </FieldGroup>
      </div>
    </div>
  );
}
