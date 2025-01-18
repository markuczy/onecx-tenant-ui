import { defineConfig } from 'cypress'

import { getPreprocessorConfig } from '@jscutlery/cypress-harness/preprocessor-config'

export default defineConfig({
  e2e: {
    supportFile: 'e2e/cypress/support/index.js',
    specPattern: 'e2e/cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    ...getPreprocessorConfig()
  },
  screenshotsFolder: 'e2e/cypress/screenshots'
})
