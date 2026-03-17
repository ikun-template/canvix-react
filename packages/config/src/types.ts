/**
 * 配置类型定义
 *
 * 使用模块扩展（Module Augmentation），允许用户自定义配置结构
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
 *     // 添加更多自定义字段
 *     customField?: string;
 *   }
 * }
 * ```
 */

/**
 * 应用配置接口
 * 默认为空对象，用户通过 declare module '@ikun-kit/config' 扩展
 */
export interface AppConfig {}

/**
 * 全局类型声明
 * 用于声明 Vite 注入的全局变量
 */
declare global {
  /** 应用配置（由 Vite 在构建时注入） */
  const __APP_CONFIG__: AppConfig;
}
