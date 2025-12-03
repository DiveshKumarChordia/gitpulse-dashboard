export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const url = new URL(request.url);
  
  // Get client ID from query param (user-provided) or env var
  const clientId = url.searchParams.get('client_id') || process.env.GITHUB_CLIENT_ID;
  
  if (!clientId) {
    return new Response(
      JSON.stringify({ error: 'No GitHub Client ID provided' }), 
      { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  const baseUrl = `${url.protocol}//${url.host}`;
  const redirectUri = `${baseUrl}/api/auth/callback`;
  
  // Store client info in state param (will be passed back in callback)
  const state = btoa(JSON.stringify({
    client_id: clientId,
    client_secret: url.searchParams.get('client_secret') || '',
    user_provided: !!url.searchParams.get('client_id'),
  }));
  
  const scope = 'repo read:org read:user';
  
  const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
  githubAuthUrl.searchParams.set('client_id', clientId);
  githubAuthUrl.searchParams.set('redirect_uri', redirectUri);
  githubAuthUrl.searchParams.set('scope', scope);
  githubAuthUrl.searchParams.set('state', state);
  
  return Response.redirect(githubAuthUrl.toString(), 302);
}
