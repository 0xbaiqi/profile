# Wanted Poster — 交互式个人主页模板

通缉令风格的 3D 个人主页，基于 React + Three.js 构建。海报由 Verlet 积分粒子系统驱动，支持鼠标拖拽、微风抖动效果。

## 技术栈

- **React + Vite + TypeScript**
- **Three.js / React Three Fiber** — 3D 渲染
- **Verlet 积分** — 纸张物理模拟
- **Canvas 2D** — 动态海报纹理生成

## 本地运行

```bash
npm install
npm run dev
```

本地开发时，将 `public/profile.example.json` 复制为 `public/profile.json` 并填入个人信息（已加入 `.gitignore`，不会提交）。

## 个人信息配置

个人信息通过运行时 fetch 加载，不存储在代码仓库中。推荐使用 **GitHub Gist** 托管：

1. 将 `public/profile.example.json` 内容复制到一个新的 Gist
2. 点击 **Raw** 获取 URL
3. 在仓库 **Settings → Secrets and variables → Actions → Secrets** 中新建 `VITE_PROFILE_URL`，值为 Raw URL
4. 重新触发部署即可

## 访问统计

使用 [Umami](https://umami.is) 做隐私友好的访问统计，script 标签通过 GitHub Actions Secret 注入，不暴露在代码中：

1. 注册 Umami，添加网站，获取 `<script>` 标签
2. 在仓库 Secrets 中新建 `MY_UMAMI`，值为完整的 `<script>` 标签
3. 每次构建自动注入到 `index.html`

## 部署

推送到 `main` 分支后，GitHub Actions 自动构建并发布至 GitHub Pages：

```
https://<username>.github.io/<repo>/
```

需要在仓库 **Settings → Pages** 中将 Source 设为 `gh-pages` 分支。
