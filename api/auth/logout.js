// Vercel Serverless Function: Handle logout (just redirects, actual logout is client-side)
export default function handler(req, res) {
  res.redirect('/')
}

