# 添加菜单

## 1. 打开前端菜单页面，添加目录

![img.png](assets/img.png)

## 2. 添加菜单

![img_1.png](assets/img_11.png)

## 3.添加权限，权限一定要关联模型，否则普通用户将无法显示正常字段，可以参考菜单中，配置管理下面的用户配置进行参考

## 支持自动添加权限

![img2.png](assets/img_1.png)

一般会在查询、更新、添加、接口绑定关联模型

![img12.png](assets/img_12.png)
可以看到，已经自动将权限生成

注意！ 自动绑定权限是扫描该表关联的所有模型，要检查下所设置的权限中，模型绑定是否正常