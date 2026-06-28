import { Hono } from 'hono'

const app = new Hono()

const REGISTRY_BASE = 'https://registry.flintstudios.workers.dev/packages'

app.get('/:namespace\\::pkg(*)', async (c) => {
  const { namespace, pkg } = c.req.param()
  const [packageName, versionSpec = 'latest'] = pkg.split('@')

  if (!packageName) return c.text('Invalid package', 400)

  try {
    const jsonUrl = `${REGISTRY_BASE}/packages/${namespace}/${packageName}.json`
    const res = await fetch(jsonUrl)

    if (!res.ok) return c.text(`Package not found`, 404)

    const versions = await res.json()
    if (!Array.isArray(versions) || versions.length === 0) {
      return c.text('No versions', 404)
    }

    const selected = versionSpec === 'latest'
      ? versions[0]                              // top = latest
      : versions.find(v => v.version === versionSpec)

    if (!selected?.url) return c.text('Version not found', 404)

    return c.redirect(selected.url, 302)
  } catch (e) {
    return c.text('Registry error', 500)
  }
})

// Catch-all: serve static assets (if bound) or 404
app.get('*', async (c) => {
  // if (c.env.ASSETS) return c.env.ASSETS.fetch(c.req)
  return c.text('Not found', 404)
})

export default app