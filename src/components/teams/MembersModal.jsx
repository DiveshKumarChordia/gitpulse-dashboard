/**
 * Team Members Modal Component
 * Shows list of team members with click to view profile
 */

import { Users, X, ChevronRight, ExternalLink } from 'lucide-react'

export function MembersModal({ members, onClose, onSelectMember }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-void-900/80 backdrop-blur-sm" 
        onClick={onClose} 
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-void-800 border border-void-600/50 rounded-2xl shadow-2xl overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-void-600/50 bg-gradient-to-r from-purple-500/10 to-fuchsia-500/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/20 rounded-xl">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-frost-100 font-bold text-lg">Team Members</h3>
              <p className="text-xs text-frost-300/60">
                {members.length} members • Click to view activity profile
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-void-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-frost-300/60" />
          </button>
        </div>
        
        {/* Members List */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {members.map(member => (
              <button
                key={member.login}
                onClick={() => onSelectMember(member)}
                className="flex items-center gap-4 p-4 bg-void-700/30 border border-void-600/50 rounded-xl hover:border-purple-400/50 hover:bg-purple-500/5 transition-all group"
              >
                <img 
                  src={member.avatarUrl} 
                  alt="" 
                  className="w-12 h-12 rounded-full ring-2 ring-void-600 group-hover:ring-purple-400/50 transition-all" 
                />
                <div className="flex-1 text-left">
                  <p className="font-semibold text-frost-100 group-hover:text-purple-400 transition-colors">
                    {member.login}
                  </p>
                  <p className="text-xs text-frost-300/60">View activity profile</p>
                </div>
                <ChevronRight className="w-5 h-5 text-frost-300/40 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" />
              </button>
            ))}
          </div>
          
          {members.length === 0 && (
            <div className="text-center py-12 text-frost-300/50">
              No members found
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-void-600/50 bg-void-900/30 text-center">
          <p className="text-xs text-frost-300/50">
            Click on a member to see their complete activity history
          </p>
        </div>
      </div>
    </div>
  )
}

export default MembersModal

