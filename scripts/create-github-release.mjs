import { spawn } from 'node:child_process'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

const scriptDir = path.dirname(fileURLToPath(import.meta.url))
const projectDir = path.resolve(scriptDir, '..')
const outputDir = path.join(projectDir, 'release-build')

const packageJson = JSON.parse(
  await readFile(path.join(projectDir, 'package.json'), 'utf8'),
)

const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const version = args.find((arg) => !arg.startsWith('--')) ?? packageJson.version

const entries = await readdir(outputDir, { withFileTypes: true }).catch(() => [])
const executable = entries
  .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith('.exe'))
  .map((entry) => path.join(outputDir, entry.name))
  .sort()[0]

if (!executable) {
  console.error(`未找到安装包，请先执行 npm run electron:build`)
  console.error(`期望目录: ${outputDir}`)
  process.exit(1)
}

const ghArgs = ['release', 'create', `v${version}`, '--generate-notes', executable]

if (dryRun) {
  console.log(['gh', ...ghArgs].join(' '))
  process.exit(0)
}

const command = process.platform === 'win32' ? 'gh.exe' : 'gh'
const child = spawn(command, ghArgs, { stdio: 'inherit' })

child.on('error', (error) => {
  console.error(`调用 GitHub CLI 失败: ${error.message}`)
  process.exit(1)
})

child.on('exit', (code) => {
  process.exit(code ?? 1)
})
