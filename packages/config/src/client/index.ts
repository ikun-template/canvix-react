/**
 * Config Client Runtime
 * 提供浏览器环境下的配置访问功能
 */
import type { AppConfig } from '../types.js';

/**
 * 引用全局类型声明
 * __APP_CONFIG__ 在 types.ts 中声明
 */
declare const __APP_CONFIG__: AppConfig;

/**
 * 配置管理器
 * 通过 CONFIG.get() 方法访问配置，而不是直接读取全局变量
 */
class ConfigManager {
  private config: AppConfig;

  constructor() {
    // 从 Vite 注入的全局变量读取配置
    this.config = __APP_CONFIG__;
  }

  /**
   * 获取配置值
   * @param path 配置路径，使用点号分隔，如 'materials.prefixed.ui-component'
   * @returns 配置值，如果不存在返回 undefined
   *
   * @example
   * ```typescript
   * import { CONFIG } from '@ikun-kit/config/client';
   *
   * const prefix = CONFIG.get('materials.prefixed.ui-component'); // 'iku'
   * ```
   */
  get<T = string>(path: string): T | undefined {
    const keys = path.split('.');
    let result: any = this.config;

    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        result = result[key];
      } else {
        return undefined;
      }
    }

    return result as T;
  }

  /**
   * 获取完整配置对象
   */
  getAll(): AppConfig {
    return this.config;
  }
}

/**
 * 全局配置实例
 * 使用 CONFIG.get() 方法访问配置
 *
 * @example
 * ```typescript
 * import { CONFIG } from '@ikun-kit/config/client';
 *
 * const prefix = CONFIG.get('materials.prefixed.ui-component');
 * const customValue = CONFIG.get('some.custom.path');
 * ```
 */
export const CONFIG = new ConfigManager();

/**
 * 导出类型
 */
export type { AppConfig } from '../types.js';
