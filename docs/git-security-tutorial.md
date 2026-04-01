# Git 与 VS Code 安全发布教程

本教程面向日常使用 VS Code、GitHub 和本地仓库的开发者，目标是减少 token、密码、API Key、聊天记录等敏感信息被误提交、误发布或误打包的风险。

## 1. 为什么需要这套安全配置

开发过程中最常见的泄露来源不是黑客攻击，而是误操作：

- 把 `.env`、聊天记录、导出日志直接提交到 Git。
- 在终端或对话记录里打印了 token，随后被归档保存。
- 发布 VS Code 扩展或 npm 包之前，没有做密钥扫描。
- 新建仓库时忘记配置 `.gitignore` 或 Git hooks。

这套配置的目标是：

- 在保存聊天记录时自动做脱敏。
- 在保存聊天记录时自动把归档目录写进 `.gitignore`。
- 在 push 前自动检查明文密钥。
- 在打包发布前再次强制检查。

## 2. 当前 chat-history 项目已经具备的安全能力

本项目 4.0.0 版本已经包含以下默认安全能力：

- 保存聊天记录前自动掩码敏感信息。
- 保存聊天记录时自动把 `docs/` 加入工作区 `.gitignore`。
- `npm run package` 前自动执行安全扫描。
- 可复用的 `maskSensitiveText()` 工具函数，供后续模块统一使用。

对应代码位置：

- `src/commands/saveCurrentChat.ts`
- `src/utils/securityUtils.ts`
- `src/utils/fileUtils.ts`
- `scripts/security-scan.js`

## 3. 机器级 Git pre-push 安全检查

如果你希望“以后新建的所有仓库”都默认带安全检查，最稳妥的方法是配置全局 Git hooks。

### 3.1 查看当前全局 hooks 路径

```powershell
git config --global core.hooksPath
```

如果没有输出，说明尚未配置。

### 3.2 创建全局 hooks 目录

Windows PowerShell：

```powershell
New-Item -ItemType Directory -Force "$HOME/.git-hooks"
```

### 3.3 配置 Git 使用全局 hooks

```powershell
git config --global core.hooksPath "$HOME/.git-hooks"
```

### 3.4 创建 pre-push 钩子

在 `$HOME/.git-hooks/pre-push` 写入下面的脚本：

```bash
#!/usr/bin/env bash
set -e

if command -v rg >/dev/null 2>&1; then
  if rg -n --hidden --glob '!node_modules/**' --glob '!.git/**' \
    'gh[pousr]_|github_pat_|sk-|AKIA[0-9A-Z]{16}|xox[baprs]-|token[[:space:]]*[:=][[:space:]]*[A-Za-z0-9._-]{12,}|password[[:space:]]*[:=][[:space:]]*[^[:space:]]+' .
  then
    echo 'Push blocked: potential secret detected.'
    exit 1
  fi
fi
```

如果你主要在 Windows 上开发，也可以改成 PowerShell 版本。

### 3.5 给脚本执行权限

如果你使用 Git Bash：

```bash
chmod +x "$HOME/.git-hooks/pre-push"
```

### 3.6 验证是否生效

在任意测试仓库中创建一个包含假 token 的文件，然后执行 `git push`。如果 push 被阻止，说明配置成功。

## 4. 项目级发布前安全扫描

全局 hook 解决的是“push 前阻断”。

但还不够，因为还有两类情况：

- 你可能跳过 push，直接本地打包。
- 你可能在 CI 或自动化流程里发布。

因此项目里还需要增加“发布前强制扫描”。

本项目采用的是：

```json
{
  "scripts": {
    "security:scan": "node scripts/security-scan.js",
    "package": "npm run security:scan && vsce package"
  }
}
```

这意味着只要执行 `npm run package`，就会先进行密钥扫描。扫描失败就不会生成 VSIX。

## 5. 敏感信息掩码策略

聊天归档最大的风险不是源码，而是自然语言内容里混入了：

- GitHub Token
- OpenAI Key
- AWS Access Key
- Bearer Token
- `password=...`
- `token: ...`
- `api_key=...`

本项目在保存聊天记录前，会统一调用 `maskSensitiveText()` 处理文本，把可识别的密钥替换为 `REDACTED`。

推荐原则：

- 先掩码，再写文件。
- 先掩码，再显示给用户。
- 先掩码，再做二次归档。

不要把“归档后再清理”当成主要策略，那通常已经太晚。

## 6. .gitignore 最佳实践

聊天记录、导出日志、调试快照通常不应该进入仓库。

建议至少忽略这些内容：

```gitignore
# AI/chat artifacts
docs/
*.log
*.tmp
.env
.env.local
```

如果你的项目确实要保留 `docs/` 里的正式文档，那么可以只忽略聊天归档专用目录，而不是整个 `docs/`。

当前 chat-history 的策略是：当用户把归档目标设为 `docs/` 时，保存命令会自动把该目录加入 `.gitignore`，避免误提交。

## 7. Token 泄露后的正确处理步骤

如果你发现 token 已经出现在：

- Git 提交中
- 聊天记录中
- CI 日志中
- 发布包中
- GitHub Release 附件中

不要只做文本替换。正确顺序应当是：

1. 立即撤销旧 token。
2. 重新登录或重新签发新 token。
3. 清理工作区明文内容。
4. 清理分支和必要时的 Git 历史。
5. 再次全量扫描。
6. 最后再发布。

如果是 GitHub OAuth token，通常需要到 GitHub 的授权应用页面撤销，而不是 Personal Access Tokens 页面。

## 8. 日常使用建议

建议把下面这套流程当成默认开发习惯：

1. 新建仓库后先配置 `.gitignore`。
2. 配置全局 Git pre-push hook。
3. 所有导出、归档、日志功能都默认做敏感信息掩码。
4. 所有发布脚本都默认接安全扫描。
5. 发布前再做一次工作区全文检索。

## 9. 本项目维护者建议清单

如果后续继续维护 chat-history，建议继续做这几项：

- 为 `maskSensitiveText()` 添加单元测试样例。
- 将更多供应商 token 前缀加入规则库。
- 给安全扫描器增加白名单机制，减少误报。
- 在保存预览界面提示“已自动掩码敏感信息”。
- 在 README 中单独增加安全章节。

## 10. 快速命令备忘

```powershell
# 编译
npm run compile

# 安全扫描
npm run security:scan

# 打包发布前检查
npm run package

# 查看全局 hooks 路径
git config --global core.hooksPath

# 设置全局 hooks 路径
git config --global core.hooksPath "$HOME/.git-hooks"
```

如果你把这套策略执行到位，大多数“误把 token、密码、聊天记录提交到远端”的问题都可以在发布前被拦住。