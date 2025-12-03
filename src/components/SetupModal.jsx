import { useState, useEffect } from 'react'
import { X, Key, Building2, User, Loader2, CheckCircle, AlertCircle, ExternalLink, Shield } from 'lucide-react'
import { validateToken, fetchUserOrgs } from '../api/github'

export function SetupModal({ onSetup, onClose, initialConfig }) {
  const [step, setStep] = useState(1)
  const [token, setToken] = useState(initialConfig?.token || '')
  const [org, setOrg] = useState(initialConfig?.org || '')
  const [username, setUsername] = useState(initialConfig?.username || '')
  const [orgs, setOrgs] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [tokenValid, setTokenValid] = useState(false)
  const [user, setUser] = useState(null)

  useEffect(() => {
    if (initialConfig?.token) {
      handleValidateToken()
    }
  }, [])

  const handleValidateToken = async () => {
    if (!token.trim()) {
      setError('Please enter a GitHub Personal Access Token')
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await validateToken(token)
      
      if (result.valid) {
        setTokenValid(true)
        setUser(result.user)
        setUsername(result.user.login)
        
        const userOrgs = await fetchUserOrgs(token)
        setOrgs(userOrgs)
        setStep(2)
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = () => {
    if (!org) {
      setError('Please select an organization')
      return
    }

    onSetup({
      token,
      org,
      username,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-void-900/90 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-lg bg-void-800 border border-void-600/50 rounded-2xl shadow-2xl animate-slide-up overflow-hidden">
        {/* Gradient top border */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-electric-400 via-neon-pink to-neon-orange" />
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-void-600/50">
          <div>
            <h2 className="text-xl font-display font-bold text-frost-100">
              {step === 1 ? 'Connect to GitHub' : 'Select Organization'}
            </h2>
            <p className="text-sm text-frost-300/60 mt-1">
              {step === 1 
                ? 'Enter your Personal Access Token to get started' 
                : 'Choose which organization to track'}
            </p>
          </div>
          {initialConfig && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-void-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-frost-300/60" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {step === 1 ? (
            <div className="space-y-6">
              {/* Token input */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-frost-200">
                  <Key className="w-4 h-4 text-electric-400" />
                  Personal Access Token
                </label>
                <input
                  type="password"
                  value={token}
                  onChange={(e) => {
                    setToken(e.target.value)
                    setError('')
                    setTokenValid(false)
                  }}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="w-full px-4 py-3 bg-void-700/50 border border-void-600/50 rounded-xl text-frost-100 placeholder-frost-300/40 font-mono text-sm focus:outline-none focus:border-electric-400/50 focus:ring-2 focus:ring-electric-400/25 transition-all"
                />
                {tokenValid && (
                  <div className="flex items-center gap-2 text-sm text-neon-green">
                    <CheckCircle className="w-4 h-4" />
                    Token validated successfully
                  </div>
                )}
              </div>

              {/* Instructions */}
              <div className="bg-void-700/30 border border-void-600/30 rounded-xl p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-electric-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-frost-300/80">
                    <p className="font-medium text-frost-200 mb-2">Required Token Scopes:</p>
                    <ul className="space-y-1 text-frost-300/70">
                      <li>• <code className="text-electric-400">repo</code> - Access repositories</li>
                      <li>• <code className="text-electric-400">read:org</code> - Read organization membership</li>
                    </ul>
                  </div>
                </div>
                <a
                  href="https://github.com/settings/tokens/new?description=GitPulse%20Dashboard&scopes=repo,read:org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-electric-400 hover:text-electric-500 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Create a new token on GitHub
                </a>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <button
                onClick={handleValidateToken}
                disabled={loading || !token.trim()}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-electric-400 to-electric-500 hover:from-electric-500 hover:to-electric-600 rounded-xl text-void-900 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed glow-blue"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Validating...
                  </>
                ) : (
                  'Continue'
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* User info */}
              {user && (
                <div className="flex items-center gap-4 p-4 bg-void-700/30 border border-void-600/30 rounded-xl">
                  <img
                    src={user.avatar_url}
                    alt={user.login}
                    className="w-12 h-12 rounded-full border-2 border-electric-400/50"
                  />
                  <div>
                    <div className="font-medium text-frost-100">{user.name || user.login}</div>
                    <div className="text-sm text-frost-300/60">@{user.login}</div>
                  </div>
                </div>
              )}

              {/* Organization selection */}
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm font-medium text-frost-200">
                  <Building2 className="w-4 h-4 text-electric-400" />
                  Select Organization
                </label>
                
                {orgs.length > 0 ? (
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {orgs.map((orgItem) => (
                      <label
                        key={orgItem.login}
                        className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                          org === orgItem.login
                            ? 'bg-electric-400/10 border-electric-400/50'
                            : 'bg-void-700/30 border-void-600/50 hover:border-void-600'
                        }`}
                      >
                        <input
                          type="radio"
                          name="org"
                          value={orgItem.login}
                          checked={org === orgItem.login}
                          onChange={(e) => setOrg(e.target.value)}
                          className="hidden"
                        />
                        <img
                          src={orgItem.avatarUrl}
                          alt={orgItem.login}
                          className="w-8 h-8 rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-frost-100">{orgItem.login}</div>
                          {orgItem.description && (
                            <div className="text-xs text-frost-300/60 truncate">{orgItem.description}</div>
                          )}
                        </div>
                        {org === orgItem.login && (
                          <CheckCircle className="w-5 h-5 text-electric-400" />
                        )}
                      </label>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-frost-300/60">
                      No organizations found. You can enter an organization name manually:
                    </p>
                    <input
                      type="text"
                      value={org}
                      onChange={(e) => setOrg(e.target.value)}
                      placeholder="organization-name"
                      className="w-full px-4 py-3 bg-void-700/50 border border-void-600/50 rounded-xl text-frost-100 placeholder-frost-300/40 text-sm focus:outline-none focus:border-electric-400/50 focus:ring-2 focus:ring-electric-400/25 transition-all"
                    />
                  </div>
                )}
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 px-4 py-3 bg-void-700/50 hover:bg-void-700 border border-void-600/50 rounded-xl text-frost-200 font-medium transition-all"
                >
                  Back
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!org}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-electric-400 to-electric-500 hover:from-electric-500 hover:to-electric-600 rounded-xl text-void-900 font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed glow-blue"
                >
                  Get Started
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

