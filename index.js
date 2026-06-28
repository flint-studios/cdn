import { Hono } from 'hono'

const app = new Hono()

const REGISTRY_BASE = 'https://registry.flintstudios.workers.dev/packages'

app.get('/*', async (c) => {
  const path = c.req.path
  // Matches: /namespace:pkg or /namespace:pkg@version
  const match = path.match(/^\/([^:]+):([^@\/]+)(?:@([^\/]+))?\/?$/)
  if (!match) {
    // Static assets or 404
    // if (c.env.ASSETS) return c.env.ASSETS.fetch(c.req)
    return c.text('Not found', 404)
  }

  const [, namespace, packageName, versionSpec = 'latest'] = match

  if (!namespace || !packageName) return c.text('Invalid package name', 400)

  try {
    const jsonUrl = `${REGISTRY_BASE}/${namespace}/${packageName}.json`
    const response = await fetch(jsonUrl)
    
    if (!response.ok) {
      return c.text(`Package not found: ${namespace}:${packageName}`, 404)
    }
    
    const versions = await response.json()
    if (!Array.isArray(versions) || versions.length === 0) {
      return c.text('No versions available', 404)
    }
    
    const selected = versionSpec === 'latest'
      ? versions[0]
      : versions.find(v => v.version === versionSpec)

    if (!selected?.url) return c.text('Version not found', 404)

    return c.redirect(selected.url, 302)
  } catch (e) {
    console.error(e)
    return c.text('Error fetching package info', 500)
  }
})

export default app