# @ikun-kit/config

配置管理工具包，支持 Node.js 和浏览器环境，使用全局类型增强实现可扩展的配置系统。

## 特性

- 🔧 **Node 运行时** - 读取和解析 YAML 配置文件
- 🌐 **Client 运行时** - 访问构建时注入的配置
- 📝 **类型安全** - 完整的 TypeScript 支持
- 🔌 **可扩展** - 通过全局类型增强自定义配置结构

## 安装

```bash
pnpm add @ikun-kit/config
```

## 核心概念

此包使用**模块扩展（Module Augmentation）**模式，允许用户自定义配置结构而不修改包源码。

### 定义你的配置类型

在项目中创建类型定义文件（如 `types/config.d.ts`）：

```typescript
/**
 * 扩展 @ikun-kit/config 的 AppConfig 接口
 *
 * 此文件会被 tsconfig.json 自动加载，无需手动 import
 */
declare module '@ikun-kit/config' {
  interface AppConfig {
    materials: {
      prefixed: {
        'ui-component': string;
        'headless-component'?: string;
      };
    };
    // 添加你的自定义字段
    customField?: string;
  }
}

export {}; // 确保文件被视为模块
```

## 使用方式

### Node 环境（构建时）

用于构建脚本、生成器等 Node.js 环境：

```typescript
import { loadConfig, loadConfigReader } from '@ikun-kit/config/node';

// 方式 1: 直接加载配置对象
const config = loadConfig('./.deploy/materials.yml');
console.log(config.materials.prefixed['ui-component']);

// 方式 2: 使用配置访问器
const reader = loadConfigReader('./.deploy/materials.yml');
const prefix = reader.get('materials.prefixed.ui-component');
const allConfig = reader.getAll();
```

**配置访问器 API:**

```typescript
class ConfigReader {
  // 通过路径访问配置值
  get<T>(path: string): T | undefined;

  // 获取完整配置对象
  getAll(): AppConfig;
}
```

### Client 环境（浏览器）

用于浏览器环境，访问由 Vite 等构建工具注入的配置：

```typescript
import { CONFIG } from '@ikun-kit/config/client';

// 获取配置值
const prefix = CONFIG.get('materials.prefixed.ui-component');

// 获取嵌套配置
const customValue = CONFIG.get('some.nested.path');

// 获取完整配置
const allConfig = CONFIG.getAll();
```

**全局配置实例 API:**

```typescript
const CONFIG: {
  // 通过路径访问配置值
  get<T>(path: string): T | undefined;

  // 获取完整配置对象
  getAll(): AppConfig;
};
```

## 与 Vite 集成

在 `vite.config.ts` 中注入配置到全局变量：

```typescript
import { defineConfig } from 'vite';
import { loadConfig } from '@ikun-kit/config/node';

const config = loadConfig('./.deploy/materials.yml');

export default defineConfig({
  define: {
    __APP_CONFIG__: JSON.stringify(config),
  },
});
```

## 完整示例

### 1. 定义配置类型

**`types/config.d.ts`:**

```typescript
/**
 * 扩展 @ikun-kit/config 配置类型
 */
declare module '@ikun-kit/config' {
  interface AppConfig {
    materials: {
      prefixed: {
        'ui-component': string;
      };
    };
  }
}

export {};
```

### 2. 配置文件

**`.deploy/materials.yml`:**

```yaml
materials:
  prefixed:
    ui-component: iku
```

### 3. Node 脚本中使用

**`scripts/generate-theme.ts`:**

```typescript
import { loadConfigReader } from '@ikun-kit/config/node';

const config = loadConfigReader('./.deploy/materials.yml');
const prefix = config.get('materials.prefixed.ui-component');

console.log(`Using prefix: ${prefix}`);
```

### 4. 浏览器代码中使用

**`src/App.tsx`:**

```typescript
import { CONFIG } from '@ikun-kit/config/client';

function App() {
  const prefix = CONFIG.get('materials.prefixed.ui-component');

  return <div>Component prefix: {prefix}</div>;
}
```

## API Reference

### 类型

```typescript
// 配置接口（用户通过 declare module 扩展）
interface AppConfig {}
```

### Node Runtime

```typescript
// 加载 YAML 配置文件
function loadConfig(configPath: string): AppConfig;

// 加载配置并创建访问器
function loadConfigReader(configPath: string): ConfigReader;

// 配置访问器类
class ConfigReader {
  get<T = any>(path: string): T | undefined;
  getAll(): AppConfig;
}
```

### Client Runtime

```typescript
// 全局配置实例
const CONFIG: {
  get<T = any>(path: string): T | undefined;
  getAll(): AppConfig;
};
```

## 最佳实践

1. **集中定义类型**: 在项目的 `types/config.ts` 中定义配置结构
2. **使用路径访问**: 优先使用 `get('path.to.value')` 而不是直接访问对象
3. **类型安全**: 利用 TypeScript 泛型确保类型安全：
   ```typescript
   const prefix = config.get<string>('materials.prefixed.ui-component');
   ```

## License

MIT
