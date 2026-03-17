export {
  type WidgetRuntime,
  type WidgetRaw,
  type LayoutMode,
} from './types.js';
export { widgetDefaults } from './defaults.js';
export { registerWidgetMigration, migrateWidget } from './migration.js';

export const WIDGET_SCHEMA_VERSION = '0.1.0';
