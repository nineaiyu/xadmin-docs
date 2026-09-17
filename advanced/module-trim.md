# 功能裁剪（模块化）

xAdmin 的功能按「功能模块」组织，可以用配置把后台裁剪成你要的样子——**不改代码、不删数据**。

二次开发时不必再面对一堆用不到的功能（聊天室、AI 助手、数据分析、表单采集……），
一条配置即可精简；用不到的功能菜单不出现、接口不可达、定时任务不注册，但数据全部保留，
随时可以开回来。

## 三级分层

| 等级 | 说明 | 模块 |
|------|------|------|
| 内核 | 身份与权限底座，**不可关闭** | `core_auth` 登录/注册/重置/会话/MFA/第三方登录 · `core_rbac` 用户/角色/菜单/部门/字典/数据与字段权限 · `core_config` 系统配置（站点/安全/消息/水印） · `core_file` 附件/预览/导入/导出 · `core_log` 操作日志/登录日志/在线用户 · `core_notify` 站内通知 · `core_open_credential` 个人访问令牌（PAT） |
| 标配 | 默认开启，可按需关闭 | `approval` 敏感操作审批 · `datamask` 数据脱敏 · `ldap` 目录同步（LDAP/AD） · `ops` 运维监控（主机监控/定时任务/Flower） |
| 可选 | 默认开启，二开时通常关闭 | `chat` 聊天室 · `ai` AI 助手与知识库 · `analysis` 数据分析（数据集/仪表盘/报表/大屏） · `dform` 表单采集 · `approval_flow` 审批流引擎（含请假） · `webhook` 事件订阅 · `open_platform` 开放平台（API 应用/OAuth） · `search` 全局搜索 · `scim` SCIM 2.0 目录同步 |

## 发行预设

修改 `xadmin-server/config.yml`：

```yaml
# full（默认，全部功能）/ standard（内核 + 标配）/ core（仅内核）
MODULE_PRESET: standard

# 在预设基础上增减（可选）
MODULE_ENABLE:
  - chat
MODULE_DISABLE:
  - analysis
  - webhook
```

| 预设 | 适用场景 |
|------|----------|
| `full` | 与升级前行为完全一致（存量部署保持此项即可，无需任何改动） |
| `standard` | **推荐的二次开发起点**：保留内核与标配，去掉 9 个可选模块 |
| `core` | 只要身份权限、系统配置、文件、通知与审计的最小后台 |

## 查看清单 / 先预演

```bash
python manage.py modules                          # 当前生效的模块清单（等级 / 页面 / 路由）
python manage.py modules --preset standard        # 预演某个组合（不改变实际配置）
python manage.py modules --enable chat --disable ops
python manage.py modules --config                 # 只输出可粘贴到 config.yml 的片段
```

切换预设前建议先做一次「体检」——在当前库的真实数据上评估影响面（只读，不改配置/不写库/不重启）：

```bash
python manage.py modules --preset standard --impact
```

```
影响面（当前库实时数据，只读）：菜单行 551（目录 13 / 页面 50 / 权限点 488）
  将隐藏：目录 4 / 页面 17 / 权限点 137    仍可见：页面 33 / 权限点 351

  模块                      等级      目录  页面  权限点  路由
  chat                    可选          0     1       7     1
  ...

  受影响角色（绑定菜单 / 其中被隐藏 / 在册用户；授权数据无需改动，运行期过滤）
    示例-员工                    40 /   34 /    1
```

后台「系统管理 → 模块管理」页同样可以查看模块清单、依赖关系，并一键复制配置片段。

## 裁剪语义

关闭一个模块后：

- **菜单与权限码不再下发**：页面从侧边栏消失，角色授权树里也不再出现该功能的权限点；
- **接口直接返回 404**：不会出现「页面没了、接口还能调」的半残状态；
- **定时任务不再注册**：历史注册条目在启动时自动清理，重新开启后自动恢复；
- **数据全部保留**：只隐藏与拦截，不删除任何数据；
- 配置变更**重启进程后生效**，重启时会自动清理菜单与权限缓存。

## 二次开发：加一个 / 减一个

**减掉一个功能**（把不用的功能连代码一起拿掉）：

```bash
python manage.py module remove <模块id>            # 只输出计划（默认行为）
python manage.py module remove <模块id> --apply    # 执行种子裁剪，目录归档到工作区 _delete/
```

**增加一个功能**（把新功能登记成模块，从而被上述开关统一管理）：

```bash
python manage.py generate_module demo_expense --app demo \
    --label "费用报销" --level optional \
    --menu DemoExpense --route "^/api/demo/expense"
```

生成的 `demo/modules.py` 即模块声明（菜单、路由前缀、权限点、周期任务、前端页面），
注册后即与内置模块一起出现在 `manage.py modules` 清单中。

## 注意事项

- 内核模块不可关闭；关闭被依赖的模块会在**启动期**直接报错并提示依赖项（fail-fast，不会静默半生效）；
- 模块配置写错（未知 id）同样在启动期报错，便于及早发现；
- 关闭模块既不需要删数据，也不需要重跑种子。

模块的完整清单、依赖关系与二开维护约定见后端仓库
`docs/architecture/模块化与功能裁剪.md`；架构决策与验收记录见
`docs/adr/ADR-045-modular-trimmable-architecture.md`。
