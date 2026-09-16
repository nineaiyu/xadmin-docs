# 版本升级与回滚

> 适用于 **Docker Compose 部署**（安装见 [容器化部署](./installation-docker.md)）。
> 升级脚本按「预检 → 备份 → 迁移 → 重建」执行，并在结束时给出回滚指引。

## 一、升级前检查（预检）

`7_upgrade.sh` 会自动完成以下检查，异常时中止或要求人工确认：

- **磁盘空间**：目标目录可用空间 ≥ 5 GiB（镜像加载 + 数据库增量余量）；
- **关键容器**：`xadmin-postgresql` / `xadmin-redis` 状态（unhealthy 时需人工确认）；
- **备份目录**：`/backups` 可写（升级流程依赖数据库备份产物）；
- **版本门槛**：当前版本满足最低升级要求。

手动确认项：

- 最近一次数据库备份时间（默认 RPO 6h，见备份相关配置 `BACKUP_INTERVAL`）；
- 如跨大版本升级，先阅读对应 Release Notes。

## 二、执行升级

```bash
# 升级到最新版本
bash scripts/7_upgrade.sh

# 指定版本
bash scripts/7_upgrade.sh v4.x.y
```

脚本流程（每步失败会给出中止/继续选项）：

1. 加载新版本 Docker 镜像；
2. **数据库备份**（失败时强烈建议中止排查，不要跳过）；
3. 配置文件备份（输出路径会打印在终端）；
4. 执行数据库迁移（结构变更，期间短暂停服）；
5. 旧镜像清理（可选）；
6. 完成提示 + **回滚指引**。

## 三、升级后验证

```bash
# 健康检查：db_status / redis_status / celery_status 应均为 true
curl http://<你的地址>/api/common/api/health

# 容器状态：全部 healthy
docker ps
```

再登录系统抽查核心功能（列表、上传、消息、审批）。

## 四、回滚（新版本异常时）

```bash
# 1. 停止服务
bash ./xadmin.sh stop

# 2. 恢复数据库（选择升级前的备份）
bash scripts/6_db_restore.sh

# 3. 恢复配置
cp <终端打印的配置备份路径> config.txt

# 4. 回退版本并重新加载镜像
#    编辑 static.env 将 VERSION 改回旧版本号
bash scripts/3_load_images.sh
bash ./xadmin.sh start
```

## 五、注意事项

- **备份优先**：没有可用备份的升级不得执行（脚本的备份失败询问在生产环境应选择中止）；
- **升级窗口**：数据库迁移期间短暂停服，请避开业务高峰；
- **数据卷**：升级不触碰数据卷（数据库 / 媒体文件），仅替换容器与镜像；
- **PITR 兜底**：若启用 WAL 归档（见部署配置），可在极端情况下按时间点恢复。

### 动态表单与审批（随版本升级的变更）

1. **新增权限点**：`availableForms:FormMySubmission`、`resubmit:FormMySubmission`，已写入种子；存量库用
   `python manage.py loaddata loadjson/menu.json loadjson/menumeta.json` 补齐（或重跑 `load_init_json`）。
   - `available-forms` 与 list 权限同口径：存量角色未重新授权也能正常填报；
   - `resubmit` 属新增功能，角色勾选后「重新提交」按钮才可用。
2. **填报页数据源切换**：由「表单设计器列表接口」改为 `available-forms`（定义类资源），普通员工无需设计器权限即可填报。
3. **审批自动完成**：动态表单提交类的审批单在审批通过后由服务端自动落库，申请人无需再次提交；
   multipart 或超大请求体仍按原协议由客户端携令牌重放。
4. **开箱模板**（可选）：新装系统执行 `python manage.py seed_demo_org` 一键生成示例组织、预置角色（四层权限）
   与场景模板，账号 `demo_staff` / `demo_lead` / `demo_fin`。
