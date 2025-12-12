# 萃豆馆 - 自助咖啡厅管理系统

[![Windows](https://img.shields.io/badge/平台-Windows-blue)](https://www.microsoft.com/windows) [![Rust](https://img.shields.io/badge/语言-Rust-orange)](https://www.rust-lang.org/) [![Tauri](https://img.shields.io/badge/框架-Tauri-green)](https://tauri.app/) [![React](https://img.shields.io/badge/工具库-React-blue)](https://reactjs.org/) [![MySQL](https://img.shields.io/badge/数据库-MySQL-blue)](https://www.mysql.com/) [![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/RainAllln/CafeHub-Tauri)

[English](README.md) | 简体中文

这是一个软件工程课程项目，一个自助咖啡厅管理系统。

## 项目概述

萃豆馆是一款使用 Tauri、React、TypeScript 和 Rust 构建的桌面应用程序，旨在管理自助咖啡厅的各个方面。它为顾客和管理员提供了一个用户友好的界面。

## 功能特性

- **顾客界面:**
  - 查看和编辑个人信息
  - 浏览和购买商品
  - 报告和认领失物
  - 向管理员发送消息
- **管理员界面:**
  - 查看经营业绩
  - 管理商品
  - 查看失物招领物品
  - 回复顾客消息

## 技术栈

- **前端:** React, TypeScript, Vite
- **后端:** Rust
- **框架:** Tauri
- **数据库:** OpenGauss

## 快速上手

1. **克隆仓库:**

   ```cmd
   git clone https://github.com/RainAllln/CafeHub-Tauri.git
   cd CafeHub-Tauri
   ```

2. **安装依赖:**

   确保您已安装 Node.js、Rust (MSVC 版本) 和 Microsoft Edge WebView2 Runtime。

   ```cmd
   npm install
   ```

3. **设置数据库:**

   - 将 `database/cafehub.sql` 文件导入到您的 MySQL 数据库中。
   - 在 `src-tauri/src/lib.rs` 中配置数据库连接。
4. **运行开发服务器:**

   ```cmd
   npx tauri dev
   ```

5. **构建应用程序:**

   ```cmd
   npx tauri build
   ```

## 推荐的 IDE 设置

- [VS Code](https://code.visualstudio.com/)
- [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode)
- [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## 致谢

- 项目使用了 [OpenGauss](https://opengauss.org/) 数据库。
