## 配置项目

在 `miniprogram/app.ts` 下配置项目的 `APP_KEY`, `LOGIN_BY_PHONE_CODE`, `ACCID`, `TOKEN` 等参数.

- `APP_KEY`: 项目的 App Key, 从 Nim 控制台获取.
- `LOGIN_BY_PHONE_CODE`: 是否通过手机验证码登录, 默认值为 `true`.如果不需要通过手机验证码登录, 可以设置为 `false`，同时需要配置 `ACCID` 和 `TOKEN`.
  - `ACCID`: 登录的账号.
  - `TOKEN`: 登录的账号的密码.

## ESM 方式引入

1. 在 `entry/nim_esm.js` 中引入 `nim-web-sdk-ng` 并注册需要使用的模块.
2. 运行 `npm run build` 进行编译，编译后的文件会在 `dist` 目录下.
3. 将编译后的产物 `NIM_FROM_BUILD.js` 复制到 `miniprogram/libs` 目录下.
4. 在 `miniprogram/app.ts` 中引入 `NIM_FROM_BUILD.js` 并初始化 Nim 实例.

```typescript
const { NIM: V2NIM, V2NIMConst } = require("./libs/NIM_FROM_BUILD.js");
```
