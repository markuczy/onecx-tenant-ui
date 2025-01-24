import {
  DatabaseContainer,
  KeycloakContainer,
  Container,
  Network,
  Wait,
  StartedNetwork,
  GenericContainer,
  StartedTestContainer
} from '@onecx/e2e'
import { exec } from 'child_process'
import fs from 'fs'
import * as path from 'path'
import { exit } from 'process'
import { MockserverContainer } from '@testcontainers/mockserver'
const mockServerClient = require('mockserver-client').mockServerClient

async function setupCypressContainer(network: StartedNetwork) {
  const cypressContainer = await new GenericContainer('cypress/included:13.17.0')
    .withEntrypoint(['tail', '-f', '/dev/null'])
    .withWorkingDir('/e2e')
    .withNetwork(network)
    .withCopyDirectoriesToContainer([
      {
        source: path.resolve('./'),
        target: '/e2e'
      }
    ])
    .withLogConsumer((stream) => {
      stream.on('data', (line) => console.log(`Cypress: `, line))
      stream.on('err', (line) => console.error(`Cypress: `, line))
      stream.on('end', () => console.log(`Cypress: Stream closed`))
    })
    .start()

  return cypressContainer
}

async function startDatabase(data: any, network: StartedNetwork) {
  const db = new DatabaseContainer(data.image, data.name, data.alias, network)
    .withDbName(data.databaseName)
    .withDbUsername(data.username)
    .withDbUserPassword(data.password)
    .withEnvironment(data.env ?? {})
    .withHealthCheck({
      test: ['CMD-SHELL', data.healthCheck.command],
      interval: data.healthCheck.interval,
      timeout: data.healthCheck.timeout,
      retries: data.healthCheck.retries
    })
    .withWaitStrategy(Wait.forHealthCheck())
    .withExposedPorts(data.port)

  const startedDb = await db.start()

  for (const u of data.users) {
    await startedDb.createUser(u.name, u.password)
  }

  for (const database of data.databases) {
    await startedDb.createDatabase(database.name, database.user)
  }
  return startedDb
}

async function startKeycloak(data: any, network: StartedNetwork) {
  const keycloak = new KeycloakContainer(data.keycloak.image, data.keycloak.name, data.keycloak.alias, network)
    .withAdminRealm(data.keycloak.adminRealm)
    .withAdminUsername(data.keycloak.adminUsername)
    .withAdminPassword(data.keycloak.adminPassword)
    .withCommand(data.keycloak.command)
    .withStartupTimeout(data.keycloak.startupTimeout)
    .withExposedPorts(data.keycloak.port)
    .withCopyFilesToContainer([
      ...data.keycloak.realms.map((realm: { name: string; path: string }) => {
        return {
          source: path.resolve(realm.path),
          target: `/opt/keycloak/data/import/${realm.name}.json`
        }
      })
    ])
    .withHealthCheck({
      test: [
        'CMD-SHELL',
        data.keycloak.realms
          .map(
            (realm: { name: string }) =>
              `{ printf >&3 'GET /realms/${realm.name}/.well-known/openid-configuration HTTP/1.0\\r\\nHost: localhost\\r\\n\\r\\n'; cat <&3; } 3<>/dev/tcp/localhost/${data.keycloak.port} | head -1 | grep 200`
          )
          .join(' && ')
      ],
      interval: data.keycloak.interval,
      timeout: data.keycloak.timeout,
      retries: data.keycloak.retries
    })
    .withWaitStrategy(Wait.forHealthCheck())
    .withEnvironment(data.keycloak.env ?? {})

  return await keycloak.start()
}

async function startShell(data: any, network: StartedNetwork) {
  // TODO: Add healthcheck
  const shellUi = new Container(data.shell.image, data.shell.name, data.shell.alias, network)
    .withEnvironment(data.shell.env ?? {})
    .withExposedPorts(data.shell.port)

  const startedShellUi = await shellUi.start()
  return startedShellUi
}

async function startContainer(container: any, network: StartedNetwork) {
  const containerDef = new Container(container.image, container.name, container.alias, network)
    .withEnvironment(container.env ?? {})
    .withExposedPorts(container.port)

  // TODO: Promise.all
  // TODO: Add healthcheck
  const startedContainer = await containerDef.start()
  return startedContainer
}

async function runTests() {
  console.log('Running e2e-tests')

  const data = JSON.parse(fs.readFileSync('./e2e/cypress/fixtures/config.json', 'utf-8'))

  const network = await new Network().start()

  const startedDb = await startDatabase(data.database, network)

  const startedKeycloak = await startKeycloak(data, network)

  const startedShellUi = await startShell(data, network)

  const containers = []
  for (const container of data.containers) {
    const startedContainer = await startContainer(container, network)
    containers.push(startedContainer)
  }

  // Setup cypress container and run the tests
  let testResult: 'success' | 'fail' = 'success'
  console.log('starting e2e tests')
  let cypressContainer: StartedTestContainer | undefined
  try {
    cypressContainer = await setupCypressContainer(network)
    const testExec = await cypressContainer.exec(['cypress', 'run', '--headed'])
    if (testExec.exitCode != 0) testResult = 'fail'
    console.log(`TESTS stdout: ${testExec.stdout}`)
    console.log('finishing e2e tests')
  } catch (error) {
    console.error('Cypress tests failed', error)
  } finally {
    // Save screenshots if cypress container is accessible
    if (cypressContainer) {
      const screenshootsStream = await cypressContainer.copyArchiveFromContainer('/e2e/e2e/cypress/screenshots')
      const filePath = path.join(path.resolve('./'), 'e2e/cypress/screenshots.tar')
      const writeableStream = fs.createWriteStream(filePath)
      screenshootsStream.pipe(writeableStream)
      writeableStream.on('finish', () => {
        exec(
          `tar -xf e2e/cypress/screenshots.tar -C e2e/cypress/container-screenshots/; rm -rf e2e/cypress/screenshots.tar`,
          (error, stdout, stderr) => {
            if (error) {
              console.error(`Error unzipping screenshots: ${error.message}`)
              console.error(`Error unzipping output:\n${stdout}`)
            }
            console.log(`Unzip import output:\n${stdout}`)
            if (stderr) {
              console.error(`Unzip errors:\n${stderr}`)
            }
          }
        )
        console.log('Screenshots has been written successfully.')
      })
      writeableStream.on('error', (err) => {
        console.error('Error writing file:', err)
      })
      await new Promise((r) => setTimeout(r, 5_000))
      await cypressContainer.stop()
      console.log('Cypress container stopped')
    }
    for (const startedContainer of containers) {
      await startedContainer.stop()
    }
    await startedShellUi.stop()
    await startedKeycloak.stop()
    await startedDb.stop()
  }

  console.log('Finished e2e-tests')
  exit(testResult === 'success' ? 0 : 1)
}

runTests().catch((err) => console.error(err))
