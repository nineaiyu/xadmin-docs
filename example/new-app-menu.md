# 添加菜单

### 1. 打开前端菜单页面，添加目录
![img.png](assets/img.png)
### 2. 添加菜单
![img_1.png](assets/img_1.png)
### 3.添加权限
![img2.png](assets/img_2.png)

### 权限标识一般如下
```ts
  const auth = reactive({
    list: hasAuth("list:demoBook"),
    create: hasAuth("create:demoBook"),
    delete: hasAuth("delete:demoBook"),
    update: hasAuth("update:demoBook"),
    export: hasAuth("export:demoBook"),
    import: hasAuth("import:demoBook"),
    batchDelete: hasAuth("batchDelete:demoBook")
});
```