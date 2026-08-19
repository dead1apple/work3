import { expect } from '@playwright/test'

export const installObservability = async (page) => {
  const errors = {
    console: [],
    page: [],
    requests: [],
  }

  page.on('console', (message) => {
    if (message.type() === 'error') errors.console.push(message.text())
  })
  page.on('pageerror', (error) => errors.page.push(error.message))
  page.on('requestfailed', (request) => {
    errors.requests.push(`${request.method()} ${request.url()} ${request.failure()?.errorText || ''}`.trim())
  })

  return errors
}

export const expectNoObservedErrors = async (page, errors) => {
  await expect(page.locator('vite-error-overlay')).toHaveCount(0)
  expect(errors.console, 'console.error entries').toEqual([])
  expect(errors.page, 'pageerror entries').toEqual([])
  expect(errors.requests, 'unexpected failed requests').toEqual([])
}

export const expectNoHorizontalOverflow = async (page) => {
  await expect.poll(() => page.evaluate(() => document.body.innerText.trim().length), {
    message: 'page should render meaningful content',
  }).toBeGreaterThan(20)
  const size = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    innerWidth: window.innerWidth,
    bodyText: document.body.innerText.trim(),
  }))
  expect(size.scrollWidth, 'document should not overflow horizontally').toBeLessThanOrEqual(size.innerWidth)
}
