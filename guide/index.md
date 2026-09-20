<div style="text-align: center;">
<h1>xAdmin-Server</h1>

**可快速开发的全栈管理系统**

xadmin 是基于 Django 6.0 + Vue 3 + Element Plus 的前后端分离全栈管理系统，目标是快速开发、高效迭代！
（元数据驱动列表页 + 三层权限 + 可裁剪模块，开箱即用且易于二次开发）
</div>

<div class="image-container" style="margin-top: 50px">


![GitHub license](https://img.shields.io/github/license/nineaiyu/xadmin-server?style=flat)
[![img](https://img.shields.io/badge/python->=3.13-green.svg)](https://python.org/)
[![img](https://img.shields.io/badge/node->=22.22.1-brightgreen)](https://nodejs.org/zh-cn/)
[![PyPI - Django Version badge](https://img.shields.io/badge/django:versions-6.0.8-blue)](https://docs.djangoproject.com/zh-hans/6.0/)
[![img](https://img.shields.io/badge/vue3-brightgreen)](https://nodejs.org/zh-cn/)
[![element-plus](https://img.shields.io/badge/element%20plus-409eff.svg)](https://element-plus.org/)
![GitHub stars](https://img.shields.io/github/stars/nineaiyu/xadmin-server?color=fa6470&style=flat)
![GitHub forks](https://img.shields.io/github/forks/nineaiyu/xadmin-server?style=flat)
</div>

## 组件项目

| Project                                                          | Status                                                                                                                                                                        | Description |
|------------------------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-------------|
| [xadmin-client](https://github.com/nineaiyu/xadmin-client)       | <a href="https://github.com/nineaiyu/xadmin-client/releases"><img alt="Client release" src="https://img.shields.io/github/release/nineaiyu/xadmin-client.svg" /></a>          | 前端          |
| [xadmin-server](https://github.com/nineaiyu/xadmin-server)       | <a href="https://github.com/nineaiyu/xadmin-server/releases"><img alt="Server release" src="https://img.shields.io/github/release/nineaiyu/xadmin-server.svg" /></a>          | 后端          |
| [xadmin-web](https://github.com/nineaiyu/xadmin-web)             | <a href="https://github.com/nineaiyu/xadmin-web/releases"><img alt="Web release" src="https://img.shields.io/github/release/nineaiyu/xadmin-web.svg" /></a>                   | NGINX       |
| [xadmin-installer](https://github.com/nineaiyu/xadmin-installer) | <a href="https://github.com/nineaiyu/xadmin-installer/releases"><img alt="Installer release" src="https://img.shields.io/github/release/nineaiyu/xadmin-installer.svg" /></a> | 容器化安装       |

## 在线体验

演示地址： https://xadmin.dvcloud.xin

账户： admin 密码： admin123

## 二次开发文档地图

xadmin 的**权威开发文档在仓库内**（随代码版本发布、与实现同步）；本站在线文档侧重安装部署与入门演示：

| 我想…… | 权威文档（GitHub dev 分支） |
|---|---|
| 30 分钟开发第一个业务模块 | [guide/first-module-30min.md](https://github.com/nineaiyu/xadmin-server/blob/dev/docs/guide/first-module-30min.md) |
| 查组件怎么用 / 怎么配 / 怎么扩 | [architecture/component-handbook.md](https://github.com/nineaiyu/xadmin-server/blob/dev/docs/architecture/component-handbook.md)（组件手册） |
| 按任务找步骤（加字段 / 加按钮 / 加任务…） | [guide/recipes.md](https://github.com/nineaiyu/xadmin-server/blob/dev/docs/guide/recipes.md)（处方集） |
| 方案怎么选（元数据驱动 vs 手写等） | [architecture/方案选型与对比.md](https://github.com/nineaiyu/xadmin-server/blob/dev/docs/architecture/%E6%96%B9%E6%A1%88%E9%80%89%E5%9E%8B%E4%B8%8E%E5%AF%B9%E6%AF%94.md) |
| 高频坑 / 静默失败排查 | [dev-pitfalls.md](https://github.com/nineaiyu/xadmin-server/blob/dev/docs/dev-pitfalls.md) |
| 完整文档索引 | [docs/README.md](https://github.com/nineaiyu/xadmin-server/blob/dev/docs/README.md) |

> 注：本站「入门 Demo 示例」是手写理解版（逐层拆解）；快速上手**优先按上面的《30 分钟》主线**（代码生成器）。

## 服务端开发参考文档

django: https://docs.djangoproject.com/zh-hans/6.0/

django-rest-framework: https://www.django-rest-framework.org/

celery: https://docs.celeryq.dev/en/latest/index.html

django-filter: https://django-filter.readthedocs.io/en/stable/

django-rest-framework-simplejwt: https://django-rest-framework-simplejwt.readthedocs.io/en/latest/

## 前端开发参考文档

vue: https://cn.vuejs.org/guide/introduction.html

element-plus: https://element-plus.org/zh-CN/component/overview.html

plus-pro-components： https://plus-pro-components.com/

## 前端基于pure-admin二次开发

pure-admin： https://pure-admin.github.io/pure-admin-doc/

## 交流群

- 731949655