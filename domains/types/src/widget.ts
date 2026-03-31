/*
 * Description: Editor-only widget types — Inspector configuration, EditorWidgetPluginDefinition.
 *
 * Author: xiaoyown
 * Created: 2026-03-26
 */

import type { OperationModel } from '@canvix-react/chronicle';
import type { WidgetRuntime } from '@canvix-react/schema-widget';
import type { WidgetPluginDefinition } from '@canvix-react/shared-types';
import type { ComponentType } from 'react';

// ── Editor Widget Plugin Definition ────────────────────────────────────────

/** WidgetPluginDefinition extended with editor-only inspector configuration. */
export type EditorWidgetPluginDefinition<T = unknown> =
  WidgetPluginDefinition<T> & {
    inspector?: WidgetInspectorConfig;
  };

// ── Inspector ──────────────────────────────────────────────────────────────

export type Chain = (string | number)[];

export type UpdateField = (chain: Chain, value: unknown) => void;

export interface InspectorField {
  chain: Chain;
  renderer: string | ComponentType<InspectorFieldRenderProps>;
  label: string;
  span?: 1 | 2 | 3 | 4;
  options?: Record<string, unknown>;
  interceptor?: InspectorFieldInterceptor;
}

export interface InspectorFieldRenderProps {
  value: unknown;
  onChange(value: unknown): void;
  widget: WidgetRuntime;
  options?: Record<string, unknown>;
}

export type InspectorFieldInterceptor = (
  value: unknown,
  context: { widget: WidgetRuntime; update: (model: OperationModel) => void },
) => { kind: string; chain: Chain; value: unknown }[] | void;

export interface InspectorGroup {
  title: string;
  properties: InspectorField[];
}

export interface WidgetInspectorConfig {
  properties?: (widget: WidgetRuntime) => InspectorGroup[];
}
