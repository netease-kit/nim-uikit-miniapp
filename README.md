# nim-uikit-miniapp

网易云信即时通讯界面组件（简称 IM UIKit）是基于 NIM SDK（网易云信 IM SDK） 开发的一款即时通讯 UI 组件库，包括聊天、会话、圈组、搜索、通讯录、群管理等组件。通过 IM UIKit，您可快速集成包含 UI 界面的即时通讯应用。



## 配置项目

在 `miniprogram/app.ts` 下配置项目的 `APP_KEY`, `LOGIN_BY_PHONE_CODE`, `ACCID`, `TOKEN` 等参数.

- `APP_KEY`: 项目的 App Key, 从 Nim 控制台获取.

- `LOGIN_BY_PHONE_CODE`: 是否通过手机验证码登录, 默认值为 `true`.如果不需要通过手机验证码登录, 可以设置为 `false`，同时需要配置 `ACCID` 和 `TOKEN`.

- `ACCID`: 登录的账号.

- `TOKEN`: 登录的账号的密码.
