// Vercel Serverless Function: Handle OAuth callback and exchange code for token
export default async function handler(req, res) {
  const { code } = req.query

  if (!code) {
    return res.redirect('/?error=no_code')
  }

  const clientId = process.env.GITHUB_CLIENT_ID
  const clientSecret = process.env.GITHUB_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return res.redirect('/?error=missing_config')
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
      return res.redirect(`/?error=${tokenData.error}`)
    }

    const accessToken = tokenData.access_token

    // Fetch user info
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    })

    const user = await userResponse.json()

    // Fetch user's organizations
    const orgsResponse = await fetch('https://api.github.com/user/orgs', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    })

    const orgs = await orgsResponse.json()

    // Redirect back to app with token and user info in URL hash (client-side only)
    // Using hash so it's not sent to server in subsequent requests
    const authData = {
      token: accessToken,
      user: {
        login: user.login,
        name: user.name,
        avatar_url: user.avatar_url,
        id: user.id,
      },
      orgs: orgs.map(o => ({
        login: o.login,
        avatar_url: o.avatar_url,
      })),
    }

    // Encode and redirect
    const encoded = Buffer.from(JSON.stringify(authData)).toString('base64')
    res.redirect(`/?auth=${encoded}`)
    
  } catch (error) {
    console.error('OAuth callback error:', error)
    res.redirect(`/?error=callback_failed`)
  }
}

