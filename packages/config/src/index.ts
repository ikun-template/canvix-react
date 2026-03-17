/**
 * @ikun-kit/config
 * 配置管理工具包
 *
 * - Node 环境：使用 '@ikun-kit/config/node'
 * - 浏览器环境：使用 '@ikun-kit/config/client'
 *
 * @example
 * ```typescript
 * // 在你的项目 types/config.d.ts 中扩展配置类型
 * declare module '@ikun-kit/config' {
 *   interface AppConfig {
 *     materials: {
 *       prefixed: {
 *         'ui-component': string;
 *       };
 *     };
 *   }
 * }
 * ```
 */

export type { AppConfig } from './types.js';
