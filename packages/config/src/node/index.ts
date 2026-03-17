/**
 * Config Node Runtime
 * 提供 Node.js 环境下的配置文件读取和解析功能
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { parse as parseYAML } from 'yaml';

import type { AppConfig } from '../types.js';

/**
 * 深度合并对象
 */
function deepMerge<T extends Record<string, any>>(
  target: T,
  source: Partial<T>,
): T {
  const result = { ...target };

  for (const key in source) {
    const sourceValue = source[key];
    const targetValue = result[key];

    if (
      sourceValue &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      result[key] = deepMerge(targetValue, sourceValue);
    } else {
      result[key] = sourceValue as T[Extract<keyof T, string>];
    }
  }

  return result;
}

/**
 * 从 YAML 文件读取配置
 *
 * @param configPath - 配置文件路径（相对或绝对）
 * @returns 解析后的配置对象
 *
 * @example
 * ```typescript
 * import { loadConfig } from '@ikun-kit/config/node';
 *
 * // 从单个文件加载
 * const config = loadConfig('./.deploy/materials.yml');
 *
 * // 从目录加载（会合并所有 .yml 和 .yaml 文件）
 * const config = loadConfig('./.deploy');
 *
 * console.log(config.materials.prefixed['ui-component']); // 'iku'
 * ```
 */
export function loadConfig(configPath: string): AppConfig {
  const absolutePath = resolve(configPath);
  const stat = statSync(absolutePath);

  // 如果是目录，读取所有 yml 文件并合并
  if (stat.isDirectory()) {
    const files = readdirSync(absolutePath)
      .filter(file => file.endsWith('.yml') || file.endsWith('.yaml'))
      .sort(); // 按文件名排序，保证合并顺序一致

    let config = {} as AppConfig;

    for (const file of files) {
      const filePath = join(absolutePath, file);
      const content = readFileSync(filePath, 'utf-8');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const parsed = parseYAML(content);

      if (parsed && typeof parsed === 'object') {
        config = deepMerge(config, parsed as Partial<AppConfig>);
      }
    }

    return config;
  }

  // 如果是文件，直接读取
  const content = readFileSync(absolutePath, 'utf-8');
  return parseYAML(content) as AppConfig;
}

/**
 * 配置访问器类
 * 提供便捷的配置值访问方法
 */
export class ConfigReader {
  constructor(private config: AppConfig) {}

  /**
   * 获取配置值
   * @param path 配置路径，使用点号分隔，如 'materials.prefixed.ui-component'
   * @returns 配置值，如果不存在返回 undefined
   *
   * @example
   * ```typescript
   * const reader = new ConfigReader(config);
   * const prefix = reader.get('materials.prefixed.ui-component'); // 'iku'
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
 * 快捷方法：加载配置并创建访问器
 *
 * @param configPath - 配置文件路径
 * @returns ConfigReader 实例
 *
 * @example
 * ```typescript
 * import { loadConfigReader } from '@ikun-kit/config/node';
 *
 * const config = loadConfigReader('./.deploy/materials.yml');
 * const prefix = config.get('materials.prefixed.ui-component');
 * ```
 */
export function loadConfigReader(configPath: string): ConfigReader {
  const config = loadConfig(configPath);
  return new ConfigReader(config);
}

/**
 * 导出类型
 */
export type { AppConfig } from '../types.js';
