import {defineConfig} from 'vitepress'
import mdItCustomAttrs from 'markdown-it-custom-attrs'
// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "xAdmin",
    description: "可快速开发的全栈管理系统",
    appearance: 'dark',
    outDir: './dist',
    // ignoreDeadLinks:true,
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

                ]
            },
            {
                text: '安装部署',
                items: [
                    {
                        text: '一键部署',
                        link: '/guide/demo'
                    },
                    {
                        text: '容器化部署',
                        link: '/guide/installation-docker'
                    },
                    {
                        text: '本地部署',
                        link: '/guide/installation-local'
                    }, {
                        text: 'NGINX部署',
                        link: '/guide/installation-nginx'
                    },{
                        text: 'MariaDB本地安装部署(可选)',
                        link: '/guide/installation-mariadb'
                    },
                ]
            },
            {
                text: '开发指南',
                items: [
                    {
                        text: '服务端开发',
                        link: '/devguidelines/server'
                    },
                    {
                        text: '客户端开发',
                        link: '/devguidelines/client'
                    }
                ]
            },
            {
                text: '入门Demo示例',
                items: [
                    {
                        text: '后端操作',
                        link: '/example/new-app-api'
                    }, {
                        text: '前端操作',
                        link: '/example/new-app-client'
                    }, {
                        text: '添加菜单',
                        link: '/example/new-app-menu'
                    }, {
                        text: '添加权限',
                        link: '/example/new-app-data-permission'
                    }, {
                        text: '测试效果',
                        link: '/example/new-app-test'
                    },
                ]
            },
            {
                text: '进阶开发',
                items: [
                    {
                        text: 'RBAC权限',
                        link: '/advanced/permission'
                    },
                    {
                        text: '数据权限',
                        link: '/advanced/data-permission'
                    }, {
                        text: '字段权限',
                        link: '/advanced/field-permission'
                    }
                ]
            },{
                text: '常见问题',
                items: [
                    {
                        text: '常见问题',
                        link: '/problem/one'
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
        config: (md) => {
            md.use(mdItCustomAttrs, 'image', {
                'data-fancybox': "gallery"
            })
        }
    },
    head: [
        ["link", {rel: "stylesheet", href: "/static/fancybox.css"}],
        ["script", {src: "/static/fancybox.umd.js"}],
    ]
})
