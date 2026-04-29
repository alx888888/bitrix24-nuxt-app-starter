function usage() {
  console.log('Usage: npm run smoke:production -- --base-url https://app.example.com')
  console.log('Alternative: APP_BASE_URL=https://app.example.com npm run smoke:production')
}

function readArg(name) {
  const args = process.argv.slice(2)
  const index = args.indexOf(name)
  if (index >= 0) return args[index + 1] || ''
  const prefix = `${name}=`
  const inline = args.find((arg) => arg.startsWith(prefix))
  return inline ? inline.slice(prefix.length) : ''
}

function joinUrl(baseUrl, path) {
  return new URL(path, baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`).toString()
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

async function fetchManual(url) {
  return fetch(url, { redirect: 'manual' })
}

async function checkRoot(baseUrl) {
  const response = await fetchManual(joinUrl(baseUrl, '/'))
  assert(response.status === 200, `GET / expected 200, got ${response.status}`)
  assert((response.headers.get('x-frame-options') || '').toLowerCase() !== 'deny', 'GET / must not set X-Frame-Options: DENY')
}

async function checkInstallRedirect(baseUrl) {
  const url = joinUrl(baseUrl, '/api/b24/install?DOMAIN=smoke.bitrix24.ru&PROTOCOL=1&LANG=ru&APP_SID=smoke')
  const response = await fetchManual(url)
  assert(response.status === 307, `GET /api/b24/install expected 307, got ${response.status}`)
  assert((response.headers.get('x-frame-options') || '').toLowerCase() !== 'deny', 'GET /api/b24/install must not set X-Frame-Options: DENY')
  const location = response.headers.get('location') || ''
  assert(location.includes('/api/b24/handler'), `GET /api/b24/install redirect must target /api/b24/handler, got ${location || '<empty>'}`)
}

async function checkStatus(baseUrl) {
  const response = await fetchManual(joinUrl(baseUrl, '/api/platform/status'))
  assert(response.status === 200, `GET /api/platform/status expected 200, got ${response.status}`)
  assert((response.headers.get('content-type') || '').includes('application/json'), 'GET /api/platform/status must return JSON')
}

async function main() {
  const baseUrl = readArg('--base-url') || process.env.APP_BASE_URL || ''
  if (!baseUrl) {
    usage()
    process.exit(2)
  }

  await checkRoot(baseUrl)
  await checkInstallRedirect(baseUrl)
  await checkStatus(baseUrl)
  console.log(`[OK] Production smoke passed: ${baseUrl}`)
}

main().catch((error) => {
  console.error(String(error?.message || error))
  process.exit(1)
})
