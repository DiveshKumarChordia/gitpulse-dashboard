# GitPulse - GitHub Activity Dashboard

A beautiful, modern dashboard to track all your GitHub commits and pull requests across multiple repositories in your organization.

![GitPulse Dashboard](https://via.placeholder.com/800x400?text=GitPulse+Dashboard)

## Features

✨ **Unified Activity Timeline** - View all your commits and PRs in a single, chronological timeline

🔍 **Smart Filtering** - Filter by:
- Date range
- Single or multiple repositories
- Activity type (Commits, PRs, or both)
- Search by message, repo, or branch

📊 **Quick Stats** - At-a-glance metrics for commits, PRs, and active repositories

🔗 **Direct Navigation** - Click any activity to open it directly on GitHub

🎨 **Modern Design** - Beautiful dark theme with smooth animations and a unique aesthetic

## Getting Started

### Prerequisites

- Node.js 18+ 
- A GitHub Personal Access Token with the following scopes:
  - `repo` - Access repositories
  - `read:org` - Read organization membership

### Installation

1. Clone or download this project

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open http://localhost:5173 in your browser

### Setup

1. Create a GitHub Personal Access Token at https://github.com/settings/tokens/new
   - Select scopes: `repo` and `read:org`
   
2. Enter your token in the setup modal when you first open the app

3. Select your organization

4. Start exploring your activity!

## Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory, ready to deploy to any static hosting service.

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Connect your repo to [Vercel](https://vercel.com)
3. Deploy with default settings

### Netlify

1. Build the project: `npm run build`
2. Drag the `dist` folder to [Netlify Drop](https://app.netlify.com/drop)

### GitHub Pages

1. Build the project: `npm run build`
2. Deploy the `dist` folder to GitHub Pages

## Tech Stack

- **React 18** - UI library
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **date-fns** - Date formatting
- **GitHub REST API** - Data fetching

## Security Note

Your GitHub Personal Access Token is stored locally in your browser's localStorage. It's never sent to any server other than GitHub's API. For additional security, you can create a token with minimal permissions and revoke it anytime from your GitHub settings.

## License

MIT License - Feel free to use this for your own projects!

---

Made with ⚡ by GitPulse

