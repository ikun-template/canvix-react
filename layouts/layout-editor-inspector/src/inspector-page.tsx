import type { LayoutPluginContext } from '@canvix-react/dock-editor';
import {
  PiColor,
  PiNumber,
  PiPadding,
  PiSelect,
  PiText,
} from '@canvix-react/inspector-controls';
import { useI18n } from '@canvix-react/toolkit-editor';
import type { OperationModel } from '@canvix-react/toolkit-editor';
import { PageLiveProvider, usePageLive } from '@canvix-react/toolkit-shared';
import { FieldGroup } from '@canvix-react/ui-inspector';
import { useCallback } from 'react';

interface InspectorPageProps {
  ctx: LayoutPluginContext;
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
  ctx: LayoutPluginContext;
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
      <div className="min-w-0 overflow-x-hidden overflow-y-auto px-3 py-2">
        <div className="mb-3">
          <PiText
            label={t('inspector.name')}
            value={page.name}
            onChange={v => updateField(['name'], v)}
          />
        </div>

        <FieldGroup title={t('inspector.size')}>
          <div className="flex gap-2">
            <div className="min-w-0 flex-1">
              <PiNumber
                label={t('inspector.size.width')}
                value={page.layout.size[0]}
                onChange={v => updateField(['layout', 'size', 0], v)}
                min={1}
              />
            </div>
            <div className="min-w-0 flex-1">
              <PiNumber
                label={t('inspector.size.height')}
                value={page.layout.size[1]}
                onChange={v => updateField(['layout', 'size', 1], v)}
                min={1}
              />
            </div>
          </div>
        </FieldGroup>

        <FieldGroup title="布局">
          <div className="flex flex-col gap-2.5">
            <div className="flex gap-2">
              <div className="min-w-0 flex-1">
                <PiSelect
                  label="方向"
                  value={page.layout.direction}
                  onChange={v => updateField(['layout', 'direction'], v)}
                  items={[
                    { label: '水平', value: 'row' },
                    { label: '垂直', value: 'column' },
                  ]}
                />
              </div>
              <div className="min-w-0 flex-1">
                <PiSelect
                  label="换行"
                  value={page.layout.wrap}
                  onChange={v => updateField(['layout', 'wrap'], v)}
                  items={[
                    { label: '不换行', value: 'nowrap' },
                    { label: '换行', value: 'wrap' },
                  ]}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="min-w-0 flex-1">
                <PiNumber
                  label="间距"
                  value={page.layout.gap}
                  onChange={v => updateField(['layout', 'gap'], v)}
                  min={0}
                />
              </div>
              <div className="min-w-0 flex-1">
                <PiSelect
                  label="对齐"
                  value={page.layout.align}
                  onChange={v => updateField(['layout', 'align'], v)}
                  items={[
                    { label: '顶部', value: 'start' },
                    { label: '居中', value: 'center' },
                    { label: '底部', value: 'end' },
                    { label: '拉伸', value: 'stretch' },
                  ]}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="min-w-0 flex-1">
                <PiSelect
                  label="分布"
                  value={page.layout.justify}
                  onChange={v => updateField(['layout', 'justify'], v)}
                  items={[
                    { label: '起始', value: 'start' },
                    { label: '居中', value: 'center' },
                    { label: '末尾', value: 'end' },
                    { label: '两端', value: 'between' },
                    { label: '环绕', value: 'around' },
                    { label: '均分', value: 'evenly' },
                  ]}
                />
              </div>
              <div className="min-w-0 flex-1" />
            </div>
            <PiPadding
              label="内边距"
              value={page.layout.padding}
              onChange={v => updateField(['layout', 'padding'], v)}
            />
          </div>
        </FieldGroup>

        <FieldGroup title={t('inspector.color')}>
          <div className="flex gap-2">
            <div className="min-w-0 flex-1">
              <PiColor
                label={t('inspector.color.background')}
                value={page.background}
                onChange={v => updateField(['background'], v)}
              />
            </div>
            <div className="min-w-0 flex-1">
              <PiColor
                label={t('inspector.color.foreground')}
                value={page.foreground}
                onChange={v => updateField(['foreground'], v)}
              />
            </div>
          </div>
        </FieldGroup>
      </div>
    </div>
  );
}
