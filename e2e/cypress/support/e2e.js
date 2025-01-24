import '@jscutlery/cypress-harness/support'
require('cypress-terminal-report/src/installLogsCollector')({
  xhr: {
    printBody: true,
    printHeaderData: true,
    printRequestData: true
  }
})
