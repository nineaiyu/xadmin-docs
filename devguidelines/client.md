# 客户端开发不限平台

> 环境要求以仓库为准：Node **≥ 22.22.1**（`.nvmrc` 为 v24）、pnpm **≥ 11**；完整步骤与门禁清单见
> [xadmin-client README](https://github.com/nineaiyu/xadmin-client/blob/dev/README.md)。

## 1.客户端 WebStorm 配置使用

本地需要安装 nodejs 环境，推荐使用 [.nvmrc](https://github.com/nineaiyu/xadmin-client/blob/dev/.nvmrc) 指定的 LTS 版本 [下载](https://nodejs.org/zh-cn/download/prebuilt-installer)

安装全局 pnpm 命令

```shell
npm install -g pnpm
```

## 2.visual studio code 配置使用

参考链接 https://pure-admin.github.io/pure-admin-doc/pages/vscode/


## 如何快速定位到相关代码？
在页面上按住组合键时，鼠标在页面移动即会在 DOM 上出现遮罩层并显示相关信息，点击一下将自动打开 IDE 并将光标定位到元素对应的代码位置
- Mac 默认组合键 Option + Shift
- Windows 默认组合键 Alt + Shift

- 更多用法看 https://inspector.fe-dev.cn/guide/start.html