export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const oauthError = url.searchParams.get('error');

  if (oauthError) {
    return Response.redirect(`${baseUrl}/?error=${oauthError}`, 302);
  }

  if (!code) {
    return Response.redirect(`${baseUrl}/?error=no_code`, 302);
  }

  // Parse state to get client credentials
  let clientId = process.env.GITHUB_CLIENT_ID;
  let clientSecret = process.env.GITHUB_CLIENT_SECRET;
  
  if (state) {
    try {
      const stateData = JSON.parse(atob(state));
      if (stateData.user_provided && stateData.client_id) {
        clientId = stateData.client_id;
        clientSecret = stateData.client_secret;
      }
    } catch (e) {
      console.error('Failed to parse state:', e);
    }
  }

  if (!clientId || !clientSecret) {
    return Response.redirect(`${baseUrl}/?error=missing_credentials`, 302);
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
    });

    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('Token exchange error:', tokenData);
      return Response.redirect(`${baseUrl}/?error=${tokenData.error}`, 302);
    }

    const accessToken = tokenData.access_token;

    if (!accessToken) {
      return Response.redirect(`${baseUrl}/?error=no_access_token`, 302);
    }

    // Fetch user info
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GitPulse-Dashboard',
      },
    });

    if (!userResponse.ok) {
      return Response.redirect(`${baseUrl}/?error=user_fetch_failed`, 302);
    }

    const user = await userResponse.json();

    // Fetch user's organizations
    const orgsResponse = await fetch('https://api.github.com/user/orgs', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'GitPulse-Dashboard',
      },
    });

    let orgs = [];
    if (orgsResponse.ok) {
      const orgsData = await orgsResponse.json();
      orgs = Array.isArray(orgsData) ? orgsData.map(o => ({
        login: o.login,
        avatar_url: o.avatar_url,
      })) : [];
    }

    // Build auth data
    const authData = {
      token: accessToken,
      user: {
        login: user.login,
        name: user.name,
        avatar_url: user.avatar_url,
        id: user.id,
      },
      orgs: orgs,
    };

    const encoded = btoa(JSON.stringify(authData));
    
    return Response.redirect(`${baseUrl}/?auth=${encoded}`, 302);
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    return Response.redirect(`${baseUrl}/?error=callback_exception`, 302);
  }
}
