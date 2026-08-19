import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import starlight from "@astrojs/starlight";

const SITE_URL = "https://wmc837911722-del.github.io";
const BASE_PATH = "/fde-learning";

export default defineConfig({
  site: SITE_URL,
  base: BASE_PATH,
  trailingSlash: "always",
  integrations: [
    starlight({
      title: "FDE 成长手册",
      description:
        "面向有编程基础、零 FDE 经验的学习者：从岗位认知、能力训练和企业 AI 项目，到作品集与面试。",
      locales: {
        root: { label: "简体中文", lang: "zh-CN" },
      },
      logo: { src: "./src/assets/logo.svg", alt: "FDE 成长手册" },
      favicon: "/favicon.svg",
      customCss: ["./src/styles/custom.css"],
      lastUpdated: true,
      pagination: true,
      pagefind: true,
      editLink: {
        baseUrl: "https://github.com/wmc837911722-del/fde-learning/edit/main/",
      },
      social: [
        {
          icon: "github",
          label: "在 GitHub 查看 FDE 成长手册",
          href: "https://github.com/wmc837911722-del/fde-learning",
        },
      ],
      sidebar: [
        {
          label: "开始这里",
          items: [
            { label: "教程首页", link: "/" },
            { slug: "what-is-fde" },
            { slug: "skills" },
            { slug: "roadmap" },
          ],
        },
        {
          label: "做出求职证据",
          items: [
            { slug: "projects" },
            { slug: "portfolio" },
            { slug: "interview" },
            { slug: "sources" },
          ],
        },
        {
          label: "作者与服务",
          items: [
            {
              label: "查看真实项目案例",
              link: "https://wmc837911722-del.github.io/#case-study",
              attrs: { target: "_blank", rel: "noopener" },
            },
            {
              label: "讨论 AI 落地项目",
              link: "https://wmc837911722-del.github.io/#contact",
              attrs: { target: "_blank", rel: "noopener" },
            },
          ],
        },
      ],
      head: [
        { tag: "meta", attrs: { name: "author", content: "风雨" } },
        {
          tag: "link",
          attrs: {
            rel: "manifest",
            href: "/fde-learning/site.webmanifest",
          },
        },
        {
          tag: "meta",
          attrs: { property: "og:site_name", content: "FDE 成长手册" },
        },
        {
          tag: "meta",
          attrs: {
            property: "og:image",
            content: `${SITE_URL}${BASE_PATH}/og-fde-brand.png`,
          },
        },
        {
          tag: "meta",
          attrs: {
            property: "og:image:alt",
            content: "FDE 成长手册：从岗位认知到可验证交付",
          },
        },
        {
          tag: "meta",
          attrs: { property: "og:image:width", content: "1200" },
        },
        {
          tag: "meta",
          attrs: { property: "og:image:height", content: "630" },
        },
        {
          tag: "meta",
          attrs: { property: "og:image:type", content: "image/png" },
        },
        {
          tag: "meta",
          attrs: { name: "twitter:card", content: "summary_large_image" },
        },
        {
          tag: "meta",
          attrs: {
            name: "twitter:image",
            content: `${SITE_URL}${BASE_PATH}/og-fde-brand.png`,
          },
        },
        {
          tag: "meta",
          attrs: {
            name: "twitter:image:alt",
            content: "FDE 成长手册：从岗位认知到可验证交付",
          },
        },
        { tag: "meta", attrs: { name: "theme-color", content: "#080b12" } },
        {
          tag: "script",
          attrs: { type: "application/ld+json" },
          content: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Person",
                "@id": `${SITE_URL}/#person`,
                name: "风雨",
                alternateName: "Fengyu",
                url: `${SITE_URL}/`,
                description: "FDE 教程作者与企业 AI 交付实践者",
                knowsAbout: [
                  "Forward Deployed Engineering",
                  "企业 AI 应用交付",
                  "RAG、Agent 与 MCP",
                ],
                sameAs: ["https://github.com/wmc837911722-del"],
              },
              {
                "@type": "DefinedTerm",
                "@id": `${SITE_URL}${BASE_PATH}/#fde`,
                name: "Forward Deployed Engineer",
                alternateName: [
                  "FDE",
                  "前线部署工程师",
                  "前沿部署工程师",
                ],
                description:
                  "本教程中的 FDE 指靠近客户场景、把模糊问题交付成可用系统的 Forward Deployed Engineer，不指 Full Disk Encryption。",
              },
              {
                "@type": "WebSite",
                "@id": `${SITE_URL}${BASE_PATH}/#website`,
                name: "FDE 成长手册",
                url: `${SITE_URL}${BASE_PATH}/`,
                inLanguage: "zh-CN",
                creator: { "@id": `${SITE_URL}/#person` },
              },
              {
                "@type": "Course",
                "@id": `${SITE_URL}${BASE_PATH}/#course`,
                name: "如何成为 FDE：从工程基础到求职证据",
                description:
                  "面向有编程基础、零 FDE 经验的学习者，覆盖客户发现、AI 应用、生产交付、作品集与面试。",
                url: `${SITE_URL}${BASE_PATH}/`,
                inLanguage: "zh-CN",
                isAccessibleForFree: true,
                dateModified: "2026-08-19",
                coursePrerequisites:
                  "能够使用至少一种编程语言完成基础程序，并理解 Git、HTTP API 与数据库的基本概念。",
                audience: {
                  "@type": "EducationalAudience",
                  educationalRole: "有编程基础、零 FDE 经验的学习者",
                },
                about: { "@id": `${SITE_URL}${BASE_PATH}/#fde` },
                provider: { "@id": `${SITE_URL}/#person` },
                teaches: [
                  "Forward Deployed Engineering",
                  "企业 AI 应用工程",
                  "客户发现与项目范围",
                  "RAG、Agent 与 MCP",
                  "AI 评测与生产交付",
                ],
              },
            ],
          }),
        },
      ],
    }),
    sitemap(),
  ],
});
