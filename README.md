Google Maps 拓客搜索后端
这是一个基于 Playwright 自动化浏览器的项目，用于进行 Google Maps 的拓客搜索。通过模拟浏览器操作，该工具可以帮助用户在 Google Maps 上搜索并获取相关的商户信息（如餐厅、商店、公司等），并进行数据抓取。

功能
自动化浏览器搜索：通过 Playwright 模拟浏览器操作，自动化搜索 Google Maps 上的商户和服务。
商户信息抓取：从 Google Maps 上抓取商户的详细信息，如名称、地址、评分、联系方式等。
批量搜索：支持通过关键字批量查询不同类型的商户信息。
地点筛选：根据位置、商户类型、评分等条件筛选商户信息。
数据存储：将抓取到的数据保存到本地或数据库中，方便进一步分析和处理。
前提条件
在开始之前，请确保您已经满足以下要求：

Node.js 环境：需要安装 Node.js（版本 14 或更高）。
Google Maps 账户：用于提供搜索位置的 Google Maps 账号信息（虽然不涉及 API Key，但可能需要登录）。
Playwright：Playwright 是一个用于自动化浏览器操作的工具，本项目使用 Playwright 进行数据抓取。
安装
