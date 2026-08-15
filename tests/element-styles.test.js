import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

test('imports Element Plus styles required by the address dialog', () => {
  const source = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8')
  for (const component of ['dialog', 'select', 'option', 'tag', 'pagination']) {
    assert.match(source, new RegExp(`element-plus/es/components/${component}/style/css`))
  }
})
