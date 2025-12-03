export const config = {
  runtime: 'edge',
};

export default async function handler(request) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  
  if (!clientId) {
    return new Response(
      JSON.stringify({ error: 'GITHUB_CLIENT_ID not configured' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // Get the host from the request
  const url = new URL(request.url);
  const baseUrl = `${url.protocol}//${url.host}`;
  const redirectUri = `${baseUrl}/api/auth/callback`;
  
  const scope = 'repo read:org read:user';
  
  const githubAuthUrl = new URL('https://github.com/login/oauth/authorize');
  githubAuthUrl.searchParams.set('client_id', clientId);
  githubAuthUrl.searchParams.set('redirect_uri', redirectUri);
  githubAuthUrl.searchParams.set('scope', scope);
  
  return Response.redirect(githubAuthUrl.toString(), 302);
}
