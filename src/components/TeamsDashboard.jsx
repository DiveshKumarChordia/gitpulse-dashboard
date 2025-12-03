/**
 * Teams Dashboard
 * Main component for team analytics and monitoring
 */

import { useState, useEffect } from 'react'
import { 
  Building, Users, Folder, Code, FileCode, ChevronDown, 
  Loader2, AlertTriangle
} from 'lucide-react'
import { fetchUserTeams, fetchTeamMembers, fetchTeamRepos } from '../api/github/teams'
import { 
  MemberProfile, 
  MembersModal, 
  TeamReposSection, 
  TeamMembersSection 
} from './teams'
import { useToast } from './Toast'

// ============ TEAM SELECTOR COMPONENT ============
function TeamSelector({ teams, selectedTeam, onSelect, loading }) {
  const [open, setOpen] = useState(false)
  
  return (
    <div className="relative">
      <button 
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-5 py-4 bg-void-700/50 border border-void-600/50 rounded-xl hover:border-electric-400/30 transition-all"
      >
        <div className="flex items-center gap-4">
          <Users className="w-6 h-6 text-electric-400" />
          <div className="text-left">
            <p className="text-frost-100 font-semibold text-lg">
              {selectedTeam?.name || 'Select a Team'}
            </p>
            {selectedTeam && (
              <p className="text-xs text-frost-300/60">
                {selectedTeam.membersCount || '?'} members • {selectedTeam.reposCount || '?'} repositories
              </p>
            )}
          </div>
        </div>
        <ChevronDown className={`w-5 h-5 text-frost-300/60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-void-800 border border-void-600/50 rounded-xl shadow-2xl z-50 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-6 text-center">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-electric-400" />
            </div>
          ) : teams.length === 0 ? (
            <div className="p-6 text-center text-frost-300/50">
              No teams found
            </div>
          ) : (
            teams.map(team => (
              <button 
                key={team.slug} 
                onClick={() => { onSelect(team); setOpen(false) }}
                className={`w-full flex items-center justify-between px-5 py-4 hover:bg-void-700/50 transition-colors border-b border-void-600/30 last:border-b-0 ${
                  selectedTeam?.slug === team.slug ? 'bg-electric-400/10' : ''
                }`}
              >
                <div className="text-left">
                  <span className={`font-medium ${selectedTeam?.slug === team.slug ? 'text-electric-400' : 'text-frost-200'}`}>
                    {team.name}
                  </span>
                  {team.description && (
                    <p className="text-xs text-frost-300/50 mt-0.5">{team.description}</p>
                  )}
                </div>
                <span className="text-xs text-frost-300/60">
                  {team.membersCount} members
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ============ TEAM INFO CARDS ============
function TeamInfoCards({ members, repos, onMembersClick }) {
  const writeAccess = repos.filter(r => r.permissions?.push).length
  const adminAccess = repos.filter(r => r.permissions?.admin).length
  
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <button 
        onClick={onMembersClick}
        className="bg-void-700/30 border border-void-600/50 rounded-xl p-5 text-center hover:border-purple-400/50 hover:bg-purple-500/5 transition-all group cursor-pointer"
      >
        <Users className="w-7 h-7 text-purple-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
        <p className="text-3xl font-bold text-frost-100">{members.length}</p>
        <p className="text-sm text-frost-300/60">Team Members</p>
        <p className="text-xs text-purple-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
          Click to view →
        </p>
      </button>
      
      <div className="bg-void-700/30 border border-void-600/50 rounded-xl p-5 text-center">
        <Folder className="w-7 h-7 text-yellow-400 mx-auto mb-2" />
        <p className="text-3xl font-bold text-frost-100">{repos.length}</p>
        <p className="text-sm text-frost-300/60">Team Repos</p>
      </div>
      
      <div className="bg-void-700/30 border border-void-600/50 rounded-xl p-5 text-center">
        <Code className="w-7 h-7 text-neon-green mx-auto mb-2" />
        <p className="text-3xl font-bold text-frost-100">{writeAccess}</p>
        <p className="text-sm text-frost-300/60">Write Access</p>
      </div>
      
      <div className="bg-void-700/30 border border-void-600/50 rounded-xl p-5 text-center">
        <FileCode className="w-7 h-7 text-electric-400 mx-auto mb-2" />
        <p className="text-3xl font-bold text-frost-100">{adminAccess}</p>
        <p className="text-sm text-frost-300/60">Admin Access</p>
      </div>
    </div>
  )
}

// ============ MAIN DASHBOARD ============
export function TeamsDashboard({ token, org }) {
  // State
  const [teams, setTeams] = useState([])
  const [loadingTeams, setLoadingTeams] = useState(true)
  const [selectedTeam, setSelectedTeam] = useState(null)
  const [members, setMembers] = useState([])
  const [repos, setRepos] = useState([])
  const [loadingTeamData, setLoadingTeamData] = useState(false)
  const [activeSection, setActiveSection] = useState('repos')
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [selectedMember, setSelectedMember] = useState(null)
  const toast = useToast()
  
  // Load teams
  useEffect(() => {
    const load = async () => {
      if (!token || !org) return
      setLoadingTeams(true)
      try {
        const t = await fetchUserTeams(token, org)
        setTeams(t)
        if (t.length > 0) setSelectedTeam(t[0])
      } catch (e) {
        toast.apiError(e.message)
      } finally {
        setLoadingTeams(false)
      }
    }
    load()
  }, [token, org])
  
  // Load team data when team selected
  useEffect(() => {
    const load = async () => {
      if (!selectedTeam) return
      setLoadingTeamData(true)
      setSelectedMember(null)
      try {
        const [m, r] = await Promise.all([
          fetchTeamMembers(token, org, selectedTeam.slug),
          fetchTeamRepos(token, org, selectedTeam.slug),
        ])
        setMembers(m)
        setRepos(r)
        toast.info(`${selectedTeam.name}: ${m.length} members, ${r.length} repos`)
      } catch (e) {
        toast.apiError(e.message)
      } finally {
        setLoadingTeamData(false)
      }
    }
    load()
  }, [selectedTeam, token, org])
  
  // Handle member click
  const handleMemberClick = (login) => {
    const member = members.find(m => m.login === login)
    if (member) setSelectedMember(member)
  }
  
  // Error state
  if (!token || !org) {
    return (
      <div className="p-8 bg-red-500/10 border border-red-500/30 rounded-2xl text-center">
        <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-4" />
        <h3 className="text-red-400 font-semibold text-lg">Configuration Required</h3>
        <p className="text-red-300/60 mt-2">Please configure your organization first</p>
      </div>
    )
  }
  
  // Member Profile View
  if (selectedMember) {
    return (
      <MemberProfile 
        member={selectedMember} 
        token={token} 
        org={org} 
        onBack={() => setSelectedMember(null)} 
      />
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-br from-electric-400/10 via-purple-500/10 to-yellow-400/10 border border-electric-400/30 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-gradient-to-br from-electric-400 to-purple-500 rounded-xl shadow-lg shadow-electric-400/25">
            <Building className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-frost-100 font-bold text-2xl">Teams Analytics</h2>
            <p className="text-sm text-frost-300/60">Comprehensive team monitoring & insights</p>
          </div>
        </div>
        
        <TeamSelector 
          teams={teams} 
          selectedTeam={selectedTeam} 
          onSelect={setSelectedTeam}
          loading={loadingTeams}
        />
      </div>
      
      {/* Team Info Cards */}
      {selectedTeam && !loadingTeamData && (
        <TeamInfoCards 
          members={members} 
          repos={repos} 
          onMembersClick={() => setShowMembersModal(true)}
        />
      )}
      
      {/* Section Tabs */}
      {selectedTeam && !loadingTeamData && (members.length > 0 || repos.length > 0) && (
        <div className="flex items-center gap-2 p-2 bg-void-700/30 rounded-xl border border-void-600/50 w-fit">
          <button 
            onClick={() => setActiveSection('repos')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              activeSection === 'repos' 
                ? 'bg-gradient-to-r from-yellow-400 to-orange-400 text-void-900 shadow-lg shadow-yellow-400/25' 
                : 'text-frost-300/60 hover:text-frost-200 hover:bg-void-600/50'
            }`}
          >
            <Folder className="w-5 h-5" />
            Team Repos
            <span className="text-xs px-2 py-0.5 rounded-full bg-void-900/20">{repos.length}</span>
          </button>
          
          <button 
            onClick={() => setActiveSection('members')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all ${
              activeSection === 'members' 
                ? 'bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-lg shadow-purple-500/25' 
                : 'text-frost-300/60 hover:text-frost-200 hover:bg-void-600/50'
            }`}
          >
            <Users className="w-5 h-5" />
            Team Members
            <span className="text-xs px-2 py-0.5 rounded-full bg-void-900/20">{members.length}</span>
          </button>
        </div>
      )}
      
      {/* Loading State */}
      {loadingTeamData && (
        <div className="text-center py-20">
          <Loader2 className="w-10 h-10 text-electric-400 animate-spin mx-auto mb-4" />
          <p className="text-frost-300/60 text-lg">Loading team data...</p>
        </div>
      )}
      
      {/* Content Sections */}
      {selectedTeam && !loadingTeamData && activeSection === 'repos' && repos.length > 0 && (
        <TeamReposSection 
          token={token} 
          org={org} 
          repos={repos} 
          onMemberClick={handleMemberClick}
        />
      )}
      
      {selectedTeam && !loadingTeamData && activeSection === 'members' && members.length > 0 && (
        <TeamMembersSection 
          token={token} 
          org={org} 
          members={members} 
          onMemberClick={handleMemberClick}
        />
      )}
      
      {/* Empty States */}
      {selectedTeam && !loadingTeamData && repos.length === 0 && members.length === 0 && (
        <div className="text-center py-20 text-frost-300/50">
          <Building className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg">No data available for this team</p>
        </div>
      )}
      
      {/* Members Modal */}
      {showMembersModal && (
        <MembersModal 
          members={members} 
          onClose={() => setShowMembersModal(false)} 
          onSelectMember={(m) => { 
            setShowMembersModal(false)
            setSelectedMember(m)
          }}
        />
      )}
      
      {/* CSS Animations */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.3s ease-out; }
        .animate-scaleIn { animation: scaleIn 0.2s ease-out; }
      `}</style>
    </div>
  )
}

export default TeamsDashboard
