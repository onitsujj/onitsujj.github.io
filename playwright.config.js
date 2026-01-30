// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

/**
 * Playwright configuration for git-public-profile
 * @see https://playwright.dev/docs/test-configuration
 */
module.exports = defineConfig({
  // Test directory
  testDir: './tests',

  // Test file pattern
  testMatch: '**/*.spec.js',

  // Run tests in parallel
  fullyParallel: true,

  // Fail the build on CI if test.only is left in the source code
  forbidOnly: !!process.env.CI,

  // Retry failed tests on CI
  retries: process.env.CI ? 2 : 0,

  // Limit parallel workers on CI to avoid resource issues
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: process.env.CI
    ? [['html', { open: 'never' }], ['list']]
    : [['list']],

  // Web server configuration for ES6 modules (requires HTTP, not file://)
  webServer: {
    command: 'npx serve -l 3000 .',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },

  // Shared settings for all projects
  use: {
    // Base URL for HTTP server (ES6 modules require HTTP, not file://)
    baseURL: 'http://localhost:3000',

    // Capture screenshot on failure
    screenshot: 'only-on-failure',

    // Capture trace on first retry
    trace: 'on-first-retry',

    // Video recording on failure (useful for debugging flaky tests)
    video: 'retain-on-failure',
  },

  // Timeout configuration
  timeout: 30000, // 30 seconds per test
  expect: {
    timeout: 5000, // 5 seconds for assertions
  },

  // Configure projects for different browsers and viewports
  projects: [
    // Desktop browsers
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },

    // Optional: Firefox (uncomment to enable)
    // {
    //   name: 'firefox',
    //   use: {
    //     ...devices['Desktop Firefox'],
    //   },
    // },

    // Optional: WebKit/Safari (uncomment to enable)
    // {
    //   name: 'webkit',
    //   use: {
    //     ...devices['Desktop Safari'],
    //   },
    // },

    // Mobile viewports for responsive testing
    // NOTE: Disabled until mobile-specific tests are written.
    // Re-enable when tests properly handle mobile viewport behaviors.
    // {
    //   name: 'mobile-chrome',
    //   use: {
    //     ...devices['Pixel 5'],
    //   },
    // },

    // {
    //   name: 'mobile-safari',
    //   use: {
    //     ...devices['iPhone 12'],
    //   },
    // },

    // Tablet viewport
    // {
    //   name: 'tablet',
    //   use: {
    //     ...devices['iPad (gen 7)'],
    //   },
    // },
  ],

  // Output directory for test artifacts
  outputDir: 'test-results/',
});
