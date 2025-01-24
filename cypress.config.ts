import { defineConfig } from 'cypress'

import { getPreprocessorConfig } from '@jscutlery/cypress-harness/preprocessor-config'

export default defineConfig({
  e2e: {
    supportFile: 'e2e/cypress/support/index.js',
    specPattern: 'e2e/cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    setupNodeEvents(on, config) {
      getPreprocessorConfig().setupNodeEvents(on, config)
      require('cypress-terminal-report/src/installLogsPrinter')(on, {
        printLogsToConsole: 'always'
      })
    }
  },
  screenshotsFolder: 'e2e/cypress/screenshots',
  video: true,
  videosFolder: 'e2e/cypress/screenshots',
  fixturesFolder: 'e2e/cypress/fixtures'
})
