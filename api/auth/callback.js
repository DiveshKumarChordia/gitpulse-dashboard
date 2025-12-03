// Vercel Serverless Function: Handle OAuth callback and exchange code for token
export default async function handler(req, res) {
  const { code, error: oauthError } = req.query

  // Determine base URL for redirect
  const protocol = req.headers['x-forwarded-proto'] || 'https'
  const host = req.headers['x-forwarded-host'] || req.headers.host
  const baseUrl = `${protocol}://${host}`

  if (oauthError) {
    return res.redirect(`${baseUrl}/?error=${oauthError}`)
  }

  if (!code) {
    return res.redirect(`${baseUrl}/?error=no_code`)
  }

  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return res.redirect(`${baseUrl}/?error=missing_config`)
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (tokenData.error) {
      console.error('OAuth error:', tokenData)
      return res.redirect(`${baseUrl}/?error=${tokenData.error}`)
    }

    const accessToken = tokenData.access_token

    // Fetch user info
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GitPulse-Dashboard',
      },
    })

    const user = await userResponse.json()

    // Fetch user's organizations
    const orgsResponse = await fetch('https://api.github.com/user/orgs', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GitPulse-Dashboard',
      },
    })

    const orgs = await orgsResponse.json()

    // Redirect back to app with token and user info in URL parameter
    const authData = {
      token: accessToken,
      user: {
        login: user.login,
        name: user.name,
        avatar_url: user.avatar_url,
        id: user.id,
      },
      orgs: Array.isArray(orgs) ? orgs.map(o => ({
        login: o.login,
        avatar_url: o.avatar_url,
      })) : [],
    }

    // Encode and redirect
    const encoded = Buffer.from(JSON.stringify(authData)).toString('base64')
    res.redirect(`${baseUrl}/?auth=${encoded}`)
    
  } catch (error) {
    console.error('OAuth callback error:', error)
    res.redirect(`${baseUrl}/?error=callback_failed`)
  }
}
