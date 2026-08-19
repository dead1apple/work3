import { spawn } from 'node:child_process'
import http from 'node:http'
import { setTimeout as delay } from 'node:timers/promises'

const host = '127.0.0.1'
const port = 4173
const readyUrl = `http://${host}:${port}/home`

const waitForServer = async () => {
  const deadline = Date.now() + 30_000
  while (Date.now() < deadline) {
    const ready = await new Promise((resolve) => {
      const request = http.get(readyUrl, (response) => {
        response.resume()
        resolve(response.statusCode && response.statusCode < 500)
      })
      request.on('error', () => resolve(false))
      request.setTimeout(1000, () => {
        request.destroy()
        resolve(false)
      })
    })
    if (ready) return
    await delay(250)
  }
  throw new Error(`Timed out waiting for ${readyUrl}`)
}

const run = (command, args, options = {}) => new Promise((resolve) => {
  const child = spawn(command, args, { stdio: 'inherit', shell: process.platform === 'win32', ...options })
  child.on('exit', (code, signal) => resolve({ code, signal }))
})

const waitForExit = (child, timeout = 1500) => new Promise((resolve) => {
  if (child.exitCode != null) {
    resolve(true)
    return
  }
  const timer = setTimeout(() => resolve(false), timeout)
  child.once('exit', () => {
    clearTimeout(timer)
    resolve(true)
  })
})

const stopServer = async (server) => {
  if (!server.pid || server.exitCode != null) return
  server.kill('SIGINT')
  if (await waitForExit(server)) return
  server.kill('SIGTERM')
  if (await waitForExit(server)) return
  if (process.platform === 'win32') {
    await run('taskkill', ['/pid', String(server.pid), '/T', '/F'], { stdio: 'ignore' })
    return
  }
  server.kill('SIGKILL')
}

const server = spawn(process.execPath, ['./node_modules/vite/bin/vite.js', '--host', host, '--port', String(port)], {
  stdio: 'inherit',
  shell: false,
})

try {
  await waitForServer()
  const result = await run('npx', ['playwright', 'test', ...process.argv.slice(2)], {
    env: { ...process.env, PW_SKIP_WEB_SERVER: '1' },
  })
  process.exitCode = result.code ?? (result.signal ? 1 : 0)
} catch (error) {
  console.error(error.message)
  process.exitCode = 1
} finally {
  await stopServer(server)
}
