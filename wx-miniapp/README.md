# WX-NIMIAPP

微信小程序原生应用开发框架下实现的UIKit演示项目。

## 配置项目

在 `miniprogram/app.ts` 下配置项目的 `APP_KEY`, `LOGIN_BY_PHONE_CODE`, `ACCID`, `TOKEN` 等参数.

- `APP_KEY`: 项目的 App Key, 从 Nim 控制台获取.

- `LOGIN_BY_PHONE_CODE`: 是否通过手机验证码登录, 默认值为 `true`.如果不需要通过手机验证码登录, 可以设置为 `false`，同时需要配置 `ACCID` 和 `TOKEN`.

- `ACCID`: 登录的账号.

- `TOKEN`: 登录的账号的密码.
