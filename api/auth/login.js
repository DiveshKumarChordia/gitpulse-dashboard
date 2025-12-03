// Vercel Serverless Function: Redirect to GitHub OAuth
export default function handler(req, res) {
  const clientId = process.env.GITHUB_CLIENT_ID
  
  if (!clientId) {
    return res.status(500).json({ error: 'GitHub Client ID not configured' })
  }

  const redirectUri = `${process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000'}/api/auth/callback`
  
  // Scopes needed: repo (for private repos), read:org (for org membership), read:user
  const scope = 'repo read:org read:user'
  
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`
  
  res.redirect(302, githubAuthUrl)
}

