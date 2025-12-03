# GitPulse - GitHub Activity Dashboard

A beautiful, modern dashboard to track all your GitHub commits and pull requests across multiple repositories in your organization. Features **OAuth login** and **IDE-like code search**.

## ✨ Features

### 📊 Activity Dashboard
- **Unified Activity Timeline** - View all your commits and PRs in a single, chronological timeline
- **Activity Heatmap** - GitHub-style contribution heatmap, click any day to filter
- **Smart Filtering** - Filter by date, repositories, and activity type
- **Direct Navigation** - Click any activity to open it on GitHub

### 🔍 Code Search (NEW!)
- **IDE-like Search** - Search for code across ALL your org's repositories
- **File Preview** - Expand to see file contents without leaving the app
- **Advanced Filters** - Filter by language, path, file extension
- **Syntax Highlighting** - See exactly where your search matches

### 🔐 Authentication
- **OAuth Login** - One-click "Login with GitHub" (recommended)
- **PAT Support** - Personal Access Token option for local/private use
- **Secure** - Tokens stored locally, never sent to third parties

## 🚀 Quick Start

### Option 1: Deploy to Vercel (Recommended)

1. **Fork this repository** or push to your GitHub

2. **Create a GitHub OAuth App**:
   - Go to [GitHub Developer Settings](https://github.com/settings/developers)
   - Click "New OAuth App"
   - Fill in:
     - **Application name**: GitPulse
     - **Homepage URL**: `https://your-app.vercel.app`
     - **Authorization callback URL**: `https://your-app.vercel.app/api/auth/callback`
   - Click "Register application"
   - Copy the **Client ID** and generate a **Client Secret**

3. **Deploy to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your repository
   - Add Environment Variables:
     - `GITHUB_CLIENT_ID` = your Client ID
     - `GITHUB_CLIENT_SECRET` = your Client Secret
   - Deploy!

### Option 2: Local Development

```bash
# Clone the repo
git clone https://github.com/DiveshKumarChordia/gitpulse-dashboard.git
cd gitpulse-dashboard

# Install dependencies
npm install

# Start dev server
npm run dev
```

For local OAuth testing, create a `.env.local` file:
```env
GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
```

And set your OAuth callback URL to `http://localhost:5173/api/auth/callback`

> **Note**: OAuth requires the Vercel dev server. Use `vercel dev` instead of `npm run dev` for full OAuth support locally, or use PAT authentication.

## 🔧 Tech Stack

- **React 18** + **Vite** - Fast, modern frontend
- **Tailwind CSS** - Beautiful styling
- **Vercel Serverless** - OAuth token exchange
- **GitHub API** - Search API for lightning-fast queries
- **Lucide React** - Beautiful icons

## 📡 API Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
├─────────────────────────────────────────────────────────────┤
│  OAuth Login      │  Activity Feed    │  Code Search        │
│  ────────────     │  ────────────     │  ────────────       │
│  /api/auth/login  │  Search API       │  Search API         │
│  /api/auth/callback│ (commits/PRs)    │  (code)             │
└─────────────────────────────────────────────────────────────┘
           │                    │                    │
           ▼                    ▼                    ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│ Vercel Serverless│   │   GitHub API    │   │   GitHub API    │
│ (token exchange) │   │  /search/commits│   │  /search/code   │
└─────────────────┘   │  /search/issues │   └─────────────────┘
                      └─────────────────┘
```

## 🔒 Security

- **OAuth tokens** are exchanged server-side (client secret never exposed)
- **Tokens stored** in browser's localStorage (never sent to our servers)
- **Minimal scopes** - only requests `repo` and `read:org`
- **No tracking** - zero analytics or third-party scripts

## 🆚 PAT vs OAuth

| Feature | Personal Access Token | OAuth |
|---------|----------------------|-------|
| Setup | Manual (create token) | One-click |
| Security | Token visible to user | Token hidden |
| Revocation | Manual in GitHub settings | Automatic |
| Best for | Local/private use | Production apps |

## 🛠️ Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GITHUB_CLIENT_ID` | For OAuth | Your GitHub OAuth App Client ID |
| `GITHUB_CLIENT_SECRET` | For OAuth | Your GitHub OAuth App Client Secret |

## 📝 License

MIT License - Feel free to use this for your own projects!

---

Made with ⚡ by GitPulse
