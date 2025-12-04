/**
 * Activity Heatmap Component
 * GitHub-style calendar grid showing activity intensity
 */

import { useMemo } from 'react'
import { Flame, Calendar } from 'lucide-react'
import { format, eachDayOfInterval, subMonths, isSameDay, startOfWeek, getDay } from 'date-fns'

// Day labels
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function Heatmap({ 
  activities, 
  selectedDate, 
  onDateSelect,
  months = 3,
}) {
  const today = new Date()
  const startDate = subMonths(today, months)
  
  // Build activity count map
  const activityMap = useMemo(() => {
    const map = {}
    activities?.forEach(a => {
      const key = format(new Date(a.date), 'yyyy-MM-dd')
      map[key] = (map[key] || 0) + 1
    })
    return map
  }, [activities])
  
  // Generate all days
  const days = useMemo(() => {
    return eachDayOfInterval({ start: startDate, end: today })
  }, [startDate, today])
  
  // Group days by week for grid layout
  const weeks = useMemo(() => {
    const result = []
    let currentWeek = []
    
    // Add empty cells for days before start
    const startDayOfWeek = getDay(startDate)
    for (let i = 0; i < startDayOfWeek; i++) {
      currentWeek.push(null)
    }
    
    days.forEach(day => {
      currentWeek.push(day)
      if (getDay(day) === 6) { // Saturday - end of week
        result.push(currentWeek)
        currentWeek = []
      }
    })
    
    // Add remaining days
    if (currentWeek.length > 0) {
      // Fill the rest of the week with nulls
      while (currentWeek.length < 7) {
        currentWeek.push(null)
      }
      result.push(currentWeek)
    }
    
    return result
  }, [days, startDate])
  
  // Get month labels
  const monthLabels = useMemo(() => {
    const labels = []
    let currentMonth = null
    let weekIndex = 0
    
    for (const week of weeks) {
      const firstDay = week.find(d => d !== null)
      if (firstDay) {
        const month = format(firstDay, 'MMM')
        if (month !== currentMonth) {
          labels.push({ month, weekIndex })
          currentMonth = month
        }
      }
      weekIndex++
    }
    
    return labels
  }, [weeks])
  
  const maxCount = Math.max(...Object.values(activityMap), 1)
  
  const getColor = (count) => {
    if (!count) return 'bg-void-700/40'
    const ratio = count / maxCount
    if (ratio < 0.2) return 'bg-electric-400/25'
    if (ratio < 0.4) return 'bg-electric-400/40'
    if (ratio < 0.6) return 'bg-electric-400/55'
    if (ratio < 0.8) return 'bg-electric-400/75'
    return 'bg-electric-400'
  }
  
  const totalActivities = Object.values(activityMap).reduce((a, b) => a + b, 0)
  const activeDays = Object.keys(activityMap).length
  
  return (
    <div className="bg-void-700/30 border border-void-600/50 rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Flame className="w-5 h-5 text-orange-400" />
          <span className="text-frost-100 font-semibold">Activity Heatmap</span>
          <span className="text-xs text-frost-300/50 px-2 py-1 bg-void-600/50 rounded-lg">
            {totalActivities} activities in {activeDays} days
          </span>
        </div>
        
        {selectedDate && (
          <button 
            onClick={() => onDateSelect(null)} 
            className="text-xs text-electric-400 hover:text-electric-500 px-3 py-1.5 bg-electric-400/10 rounded-lg transition-colors flex items-center gap-2"
          >
            <Calendar className="w-3 h-3" />
            Clear: {format(selectedDate, 'MMM d, yyyy')}
          </button>
        )}
      </div>
      
      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Month labels */}
          <div className="flex mb-2 ml-10">
            {monthLabels.map(({ month, weekIndex }, i) => (
              <div 
                key={`${month}-${i}`}
                className="text-xs text-frost-300/50"
                style={{ 
                  marginLeft: i === 0 ? 0 : `${(weekIndex - (monthLabels[i-1]?.weekIndex || 0) - 1) * 14}px`,
                  minWidth: '30px'
                }}
              >
                {month}
              </div>
            ))}
          </div>
          
          {/* Grid */}
          <div className="flex gap-1">
            {/* Day labels */}
            <div className="flex flex-col gap-1 mr-2">
              {DAYS.map((day, i) => (
                <div 
                  key={day} 
                  className="text-xs text-frost-300/40 h-3.5 flex items-center"
                  style={{ visibility: i % 2 === 1 ? 'visible' : 'hidden' }}
                >
                  {day}
                </div>
              ))}
            </div>
            
            {/* Weeks */}
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => {
                  if (!day) {
                    return <div key={`empty-${dayIndex}`} className="w-3.5 h-3.5" />
                  }
                  
                  const key = format(day, 'yyyy-MM-dd')
                  const count = activityMap[key] || 0
                  const isSelected = selectedDate && isSameDay(day, selectedDate)
                  const isToday = isSameDay(day, today)
                  
                  return (
                    <button
                      key={key}
                      onClick={() => onDateSelect(count > 0 ? day : null)}
                      title={`${format(day, 'EEEE, MMM d, yyyy')}: ${count} activities`}
                      className={`
                        w-3.5 h-3.5 rounded-sm transition-all
                        ${getColor(count)}
                        ${isSelected ? 'ring-2 ring-electric-400 ring-offset-1 ring-offset-void-900 scale-125 z-10' : ''}
                        ${isToday ? 'ring-1 ring-frost-300/50' : ''}
                        ${count > 0 ? 'cursor-pointer hover:scale-125 hover:ring-1 hover:ring-frost-300/30' : 'cursor-default'}
                      `}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-void-600/30">
        <span className="text-xs text-frost-300/50">
          {format(startDate, 'MMM d, yyyy')} — {format(today, 'MMM d, yyyy')}
        </span>
        <div className="flex items-center gap-2 text-xs text-frost-300/50">
          <span>Less</span>
          <div className="flex gap-0.5">
            <div className="w-3.5 h-3.5 bg-void-700/40 rounded-sm" />
            <div className="w-3.5 h-3.5 bg-electric-400/25 rounded-sm" />
            <div className="w-3.5 h-3.5 bg-electric-400/40 rounded-sm" />
            <div className="w-3.5 h-3.5 bg-electric-400/55 rounded-sm" />
            <div className="w-3.5 h-3.5 bg-electric-400/75 rounded-sm" />
            <div className="w-3.5 h-3.5 bg-electric-400 rounded-sm" />
          </div>
          <span>More</span>
        </div>
      </div>
    </div>
  )
}

export default Heatmap
