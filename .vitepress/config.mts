import {defineConfig} from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "xAdmin",
    description: "可快速开发的全栈管理系统",
    appearance:'dark',
    outDir: './dist',
    themeConfig: {

        search: {
            provider: 'local'
        },
        darkModeSwitchLabel: '主题',
        sidebarMenuLabel: '菜单',
        returnToTopLabel: '返回顶部',
        // https://vitepress.dev/reference/default-theme-config
        nav: [
            {text: '首页', link: '/'},
            {text: '指南', link: '/guide/'},
            {text: '演示平台', link: 'https://xadmin.dvcloud.xin/'},
            {text: '前端代码', link: 'https://github.com/nineaiyu/xadmin-client'},
            {text: '后端代码', link: 'https://github.com/nineaiyu/xadmin-server'},
        ],


        sidebar: [
            {
                text: '快速开始',
                items: [
                    {
                        text: '简介',
                        link: '/guide/index'
                    },
                    {
                        text: '项目介绍',
                        link: '/guide/introduction'
                    },
                    {
                        text: '安装部署',
                        link: '/guide/installation'
                    }
                ]
            },
            {
                text: '入门Demo示例',
                items: [
                    {
                        text: '后端操作',
                        link: '/example/new-app-api'
                    },                    {
                        text: '前端操作',
                        link: '/example/new-app-client'
                    },                    {
                        text: '添加菜单',
                        link: '/example/new-app-menu'
                    },                    {
                        text: '测试效果',
                        link: '/example/new-app-test'
                    },
                ]
            },
            {
                text: '进阶开发',
                items: [
                    {
                        text: '数据权限',
                        link: '/advanced/data-permission'
                    }, {
                        text: '字段权限',
                        link: '/advanced/field-permission'
                    }
                ]
            },
        ],

        socialLinks: [
            {icon: 'github', link: 'https://github.com/nineaiyu/xadmin-server'}
        ],
        footer:
            {
                message: 'MIT Licensed.',
                copyright:
                    'Copyright © 2023-present isummer <a class="miit-link" style="color: var(--vp-c-brand);" href="https://beian.miit.gov.cn" class="fake-link black-70 ph1">\n' +
                    '豫ICP备15004336号-3</a>'
            }
        ,

    },
    markdown: {
        lineNumbers: true,
    }
})
