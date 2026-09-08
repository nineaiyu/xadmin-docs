## 表单上传 FormData 字段展开协议 v1

> 对应 ADR-007（xadmin-server/docs/adr/ADR-007-multipart-form-data-v1-protocol.md）。
> 本文档是**前后端唯一权威**的 multipart/form-data 键格式契约。

### 背景

前端表单提交采用"按需切换"策略：

- **无文件**：直接 `application/json`，后端按 JSON 解析（默认 JSONParser）；
- **有文件**：切换为 `multipart/form-data`，嵌套对象字段由 axios `formSerializer: { indexes: null, dots: true }`（见 `xadmin-client/src/utils/http/index.ts`）展开为点分键，后端 `AxiosMultiPartParser`（`xadmin-server/common/drf/parsers/axios_form_data.py`）还原为嵌套 dict / list。

展开与还原依赖的键格式即本文协议。

### 键格式规则

1. **层级分隔**：键中 `.` 分隔字段层级，`a.b` 表示 `{ a: { b: ... } }`；
2. **数组下标**：纯数字段表示数组下标，`a.0.b` 表示 `{ a: [{ b: ... }] }`，多个下标按出现顺序补齐数组可（下标可不连续连续）；
3. **批量键**：顶层 `pks` 键一律按多值处理（后端 `getlist`），用于批量删除/批量操作；
4. **普通键**：其余顶层 key 为普通单值；
5. **文件字段**：随 multipart 由 Django 侧常规解析，与键展开互不影响。

### 示例

表单数据：

```
{ name: "书", category: { value: "0" }, covers: [{ value: "2", label: "1111", pk: "2" }] }
```

multipart body 键：

```
name=书
category.value=0
covers.0.value=2
covers.0.label=1111
covers.0.pk=2
```

后端还原结果：

```
{ name: "书", category: { value: "0" }, covers: [{ value: "2", label: "1111", pk: "2" }] }
```

### 边界说明

- 对象数组混合嵌套（`a.0.b.1.c`）表达能力有限，复杂结构建议在表单层先扁平化或平铺字段；
- `pks` 仅约定于顶层；
- 还原为字典/数组后的值类型均为字符串，由序列化器字段类型再转换。

### 前端契约点

- **唯一收敛点**：`xadmin-client/src/utils/http/index.ts` 的 `formSerializer` 配置（命名常量 `FORM_SERIALIZER`）；
- 换用 / 手写 XMLHttpRequest fetch FormData 时，须按本协议产出键名，后端无需改动；
- 系统中不含文件的无嵌套纯表单上传（http.upload 单文件）不受本协议影响。

### 测试保护

- 后端：`tests/unit/common/test_form_data_protocol.py` 覆盖嵌套 dict / 数组下标 / pks 批量 / 空值等用例，格式变更必须保持用例全绿。