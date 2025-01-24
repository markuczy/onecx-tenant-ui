Cypress.Commands.add('mockRequests', () => {
  cy.fixture('config.json').then((config) => {
    const mocks = config.mocks

    // TODO: Add request body match
    mocks.forEach((mock) => {
      cy.intercept(mock.method, mock.url, {
        statusCode: mock.response.statusCode,
        body: mock.response.body,
        headers: mock.response.headers
      }).as(mock.id)
    })
  })
})
