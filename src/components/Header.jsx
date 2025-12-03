import { Menu, Settings, LogOut, Github, Zap, Activity, Code2, History } from 'lucide-react'

export function Header({ config, onLogout, onOpenSetup, sidebarOpen, onToggleSidebar, activeTab, onTabChange }) {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-void-900/80 border-b border-void-600/50">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          {activeTab === 'activity' && (
            <button
              onClick={onToggleSidebar}
              className="p-2 hover:bg-void-700 rounded-lg transition-colors"
              title={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
            >
              <Menu className="w-5 h-5 text-frost-200" />
            </button>
          )}
          
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-electric-400 to-neon-pink rounded-xl flex items-center justify-center glow-blue">
                <Zap className="w-5 h-5 text-void-900" />
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-neon-green rounded-full border-2 border-void-900" />
            </div>
            <div>
              <h1 className="font-display font-bold text-xl gradient-text">GitPulse</h1>
              <p className="text-xs text-frost-300/60 font-mono">Activity Dashboard</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        {config?.org && (
          <div className="flex items-center gap-1 p-1 bg-void-700/50 rounded-xl border border-void-600/50">
            <button
              onClick={() => onTabChange('activity')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                activeTab === 'activity'
                  ? 'bg-electric-400 text-void-900'
                  : 'text-frost-300/60 hover:text-frost-200 hover:bg-void-600/50'
              }`}
            >
              <Activity className="w-4 h-4" />
              Activity
            </button>
            <button
              onClick={() => onTabChange('search')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                activeTab === 'search'
                  ? 'bg-neon-pink text-white'
                  : 'text-frost-300/60 hover:text-frost-200 hover:bg-void-600/50'
              }`}
            >
              <Code2 className="w-4 h-4" />
              Code Search
            </button>
            <button
              onClick={() => onTabChange('history')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all ${
                activeTab === 'history'
                  ? 'bg-orange-500 text-white'
                  : 'text-frost-300/60 hover:text-frost-200 hover:bg-void-600/50'
              }`}
            >
              <History className="w-4 h-4" />
              File History
            </button>
          </div>
        )}

        {config && (
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-void-700/50 rounded-xl border border-void-600/50">
              {config.user?.avatar_url && (
                <img 
                  src={config.user.avatar_url} 
                  alt={config.username}
                  className="w-6 h-6 rounded-full"
                />
              )}
              <Github className="w-4 h-4 text-electric-400" />
              <span className="text-sm text-frost-200">
                <span className="text-frost-300/60">@</span>
                {config.username}
              </span>
              <span className="text-frost-300/40">•</span>
              <span className="text-sm text-electric-400 font-medium">{config.org}</span>
              {config.authMethod === 'oauth' && (
                <span className="px-1.5 py-0.5 bg-neon-green/20 text-neon-green text-xs rounded">
                  OAuth
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenSetup}
                className="p-2 hover:bg-void-700 rounded-lg transition-colors group"
                title="Settings"
              >
                <Settings className="w-5 h-5 text-frost-300/60 group-hover:text-electric-400 transition-colors" />
              </button>
              
              <button
                onClick={onLogout}
                className="p-2 hover:bg-red-500/10 rounded-lg transition-colors group"
                title="Logout"
              >
                <LogOut className="w-5 h-5 text-frost-300/60 group-hover:text-red-400 transition-colors" />
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}
