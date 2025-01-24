import { getHarness } from '@jscutlery/cypress-harness'
import { InteractiveDataViewHarness, PageHeaderHarness } from '@onecx/angular-accelerator/testing'

describe('module spec', () => {
  const harness = getHarness(PageHeaderHarness)
  const dataViewHarness = getHarness(InteractiveDataViewHarness)

  let SHELL_ADDRESS
  let KEYCLOAK_ADDRESS
  let TENANT_ADDRESS
  beforeEach(() => {
    SHELL_ADDRESS = 'e2e-shell-ui:8080'
    TENANT_ADDRESS = 'e2e-tenant-ui:8080'
    KEYCLOAK_ADDRESS = 'e2e-keycloak-app:8080'
    cy.mockRequests()
  })
  it('passes', () => {
    cy.visit('https://example.cypress.io')
  })

  it('renders the page', () => {
    cy.visit(`http://${SHELL_ADDRESS}/onecx-shell/admin/tenant`)

    cy.origin(`http://${KEYCLOAK_ADDRESS}`, { args: { KEYCLOAK_ADDRESS } }, ({ KEYCLOAK_ADDRESS }) => {
      cy.url().should('include', `${KEYCLOAK_ADDRESS}`)
      cy.get('input[name="username"]').type('onecx')
      cy.get('input[name="password"]').type('onecx')
      cy.get('input[name="login"]').click()
    })

    cy.url().should('include', `${SHELL_ADDRESS}`)

    cy.wait('@tenants')

    cy.wait(5_000)

    cy.title().should('eq', 'my page changed')
  })

  it('should use harness', () => {
    cy.visit(`http://${SHELL_ADDRESS}/onecx-shell/admin/tenant`)

    cy.origin(`http://${KEYCLOAK_ADDRESS}`, { args: { KEYCLOAK_ADDRESS } }, ({ KEYCLOAK_ADDRESS }) => {
      cy.url().should('include', `${KEYCLOAK_ADDRESS}`)
      cy.get('input[name="username"]').type('onecx')
      cy.get('input[name="password"]').type('onecx')
      cy.get('input[name="login"]').click()
    })

    cy.url().should('include', `${SHELL_ADDRESS}`)

    cy.wait('@tenants')

    cy.wait(5_000)

    harness.getHeaderText().should('equal', 'Tenants')
    harness.getSubheaderText().should('equal', 'wrong subheader text value')
    // const rows = dataViewHarness.getDataView().getDataTable().getRows().get
    // expect(rows).to.equal(3)
  })

  it('should fail', () => {
    expect(true).to.equal(false)
  })
})
