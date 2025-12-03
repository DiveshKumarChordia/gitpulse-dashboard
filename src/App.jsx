import { useState, useEffect, useCallback } from 'react'
import { format, isSameDay } from 'date-fns'
import { Header } from './components/Header'
import { Sidebar } from './components/Sidebar'
import { Timeline } from './components/Timeline'
import { SetupModal } from './components/SetupModal'
import { StatsBar } from './components/StatsBar'
import { HeatMap } from './components/HeatMap'
import { CodeSearch } from './components/CodeSearch'
import { FileHistory } from './components/FileHistory'
import { TeamsDashboard } from './components/TeamsDashboard'
import { EmptyState } from './components/EmptyState'
import { LoadingState } from './components/LoadingState'
import { ToastProvider } from './components/Toast'
import { fetchUserActivities, fetchAllOrgRepos } from './api/github'

function AppContent() {
  const [config, setConfig] = useState(() => {
    const saved = localStorage.getItem('github-dashboard-config')
    return saved ? JSON.parse(saved) : null
  })
  
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(null)
  const [error, setError] = useState(null)
  const [repos, setRepos] = useState([])
  const [allRepos, setAllRepos] = useState([])
  
  // Active tab
  const [activeTab, setActiveTab] = useState('activity') // 'activity' | 'search' | 'history' | 'teams'
  
  // Filters
  const [dateRange, setDateRange] = useState({ from: '', to: '' })
  const [selectedRepos, setSelectedRepos] = useState([])
  const [activityType, setActivityType] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDate, setSelectedDate] = useState(null)
  
  const [showSetup, setShowSetup] = useState(!config)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const authData = params.get('auth')
    const error = params.get('error')
    
    if (error) {
      console.error('OAuth error:', error)
      window.history.replaceState({}, '', window.location.pathname)
      return
    }
    
    if (authData) {
      try {
        const decoded = JSON.parse(atob(authData))
        // Show org selection if multiple orgs
        if (decoded.orgs && decoded.orgs.length > 0) {
          setConfig({
            token: decoded.token,
            username: decoded.user.login,
            user: decoded.user,
            orgs: decoded.orgs,
            org: decoded.orgs.length === 1 ? decoded.orgs[0].login : null,
            authMethod: 'oauth',
          })
          if (decoded.orgs.length > 1) {
            setShowSetup(true)
          }
        }
        // Clear URL
        window.history.replaceState({}, '', window.location.pathname)
      } catch (e) {
        console.error('Failed to parse auth data:', e)
      }
    }
  }, [])

  // Save config to localStorage
  useEffect(() => {
    if (config) {
      localStorage.setItem('github-dashboard-config', JSON.stringify(config))
    }
  }, [config])

  // Fetch activities
  const loadActivities = useCallback(async () => {
    if (!config?.token || !config?.org) return
    
    setLoading(true)
    setError(null)
    setProgress(null)
    
    try {
      const orgRepos = await fetchAllOrgRepos(config.token, config.org)
      setAllRepos(orgRepos)
      
      const data = await fetchUserActivities(
        config.token, 
        config.org, 
        config.username,
        (prog) => setProgress(prog)
      )
      setActivities(data.activities)
      setRepos(data.repos)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setProgress(null)
    }
  }, [config])

  useEffect(() => {
    if (config?.org) {
      loadActivities()
    }
  }, [config?.org, loadActivities])

  const handleSetup = (newConfig) => {
    setConfig(prev => ({ ...prev, ...newConfig }))
    setShowSetup(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('github-dashboard-config')
    setConfig(null)
    setActivities([])
    setRepos([])
    setAllRepos([])
    setShowSetup(true)
  }

  const handleDateSelect = (date) => {
    setSelectedDate(date)
    if (date) {
      setDateRange({ from: '', to: '' })
    }
  }

  // Filter activities
  const filteredActivities = activities.filter(activity => {
    if (selectedDate) {
      const activityDate = new Date(activity.date)
      if (!isSameDay(activityDate, selectedDate)) return false
    } else {
      if (dateRange.from) {
        const activityDate = new Date(activity.date)
        const fromDate = new Date(dateRange.from)
        fromDate.setHours(0, 0, 0, 0)
        if (activityDate < fromDate) return false
      }
      if (dateRange.to) {
        const activityDate = new Date(activity.date)
        const toDate = new Date(dateRange.to)
        toDate.setHours(23, 59, 59, 999)
        if (activityDate > toDate) return false
      }
    }
    
    if (selectedRepos.length > 0 && !selectedRepos.includes(activity.repo)) {
      return false
    }
    
    if (activityType !== 'all' && activity.type !== activityType) {
      return false
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const matchesMessage = activity.message?.toLowerCase().includes(query)
      const matchesRepo = activity.repo.toLowerCase().includes(query)
      const matchesBranch = activity.branch?.toLowerCase().includes(query)
      if (!matchesMessage && !matchesRepo && !matchesBranch) return false
    }
    
    return true
  })

  const stats = {
    totalCommits: filteredActivities.filter(a => a.type === 'commit').length,
    totalPRs: filteredActivities.filter(a => a.type === 'pr').length,
    reposActive: [...new Set(filteredActivities.map(a => a.repo))].length,
  }

  const hasActiveFilters = selectedRepos.length > 0 || dateRange.from || dateRange.to || activityType !== 'all' || selectedDate

  // Check if setup is needed
  const needsSetup = !config || !config.org

  return (
    <div className="min-h-screen bg-void-900 bg-grid">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-electric-400/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-neon-pink/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-neon-orange/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      <div className="relative z-10">
        <Header 
          config={config} 
          onLogout={handleLogout}
          onOpenSetup={() => setShowSetup(true)}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
        
        <div className="flex">
          {activeTab === 'activity' && (
            <Sidebar 
              isOpen={sidebarOpen}
              repos={repos}
              allRepos={allRepos}
              selectedRepos={selectedRepos}
              onRepoChange={setSelectedRepos}
              dateRange={dateRange}
              onDateRangeChange={(range) => {
                setDateRange(range)
                if (range.from || range.to) {
                  setSelectedDate(null)
                }
              }}
              activityType={activityType}
              onActivityTypeChange={setActivityType}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onRefresh={loadActivities}
              loading={loading}
              progress={progress}
            />
          )}
          
          <main className={`flex-1 transition-all duration-300 ${sidebarOpen && activeTab === 'activity' ? 'ml-80' : 'ml-0'}`}>
            <div className="p-6 max-w-6xl mx-auto">
              {activeTab === 'activity' ? (
                <>
                  <StatsBar stats={stats} />
                  
                  {activities.length > 0 && !loading && (
                    <HeatMap 
                      activities={activities}
                      selectedDate={selectedDate}
                      onDateSelect={handleDateSelect}
                    />
                  )}
                  
                  {selectedDate && (
                    <div className="mb-6 flex items-center gap-3 p-4 bg-neon-pink/10 border border-neon-pink/30 rounded-xl">
                      <span className="text-neon-pink font-medium">
                        Showing activities for {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                      </span>
                      <button
                        onClick={() => setSelectedDate(null)}
                        className="ml-auto text-sm text-frost-300/60 hover:text-frost-100 transition-colors"
                      >
                        Clear filter
                      </button>
                    </div>
                  )}
                  
                  {loading ? (
                    <LoadingState progress={progress} />
                  ) : error ? (
                    <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
                      <p className="text-red-400 font-medium">{error}</p>
                      <button 
                        onClick={loadActivities}
                        className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : filteredActivities.length === 0 ? (
                    <EmptyState hasFilters={hasActiveFilters} />
                  ) : (
                    <Timeline activities={filteredActivities} />
                  )}
                </>
              ) : activeTab === 'search' ? (
                <CodeSearch 
                  token={config?.token}
                  org={config?.org}
                  allRepos={allRepos}
                />
              ) : activeTab === 'history' ? (
                <FileHistory 
                  token={config?.token}
                  org={config?.org}
                  allRepos={allRepos}
                />
              ) : (
                <TeamsDashboard 
                  token={config?.token}
                  org={config?.org}
                />
              )}
            </div>
          </main>
        </div>
      </div>

      {(showSetup || needsSetup) && (
        <SetupModal 
          onSetup={handleSetup} 
          onClose={() => !needsSetup && setShowSetup(false)}
          initialConfig={config}
        />
      )}
    </div>
  )
}

function App() {
  return (
    <ToastProvider>
      <AppContent />
    </ToastProvider>
  )
}

export default App
