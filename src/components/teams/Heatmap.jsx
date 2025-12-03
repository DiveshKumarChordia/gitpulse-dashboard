/**
 * Activity Heatmap Component
 * Visual calendar showing activity intensity
 */

import { useMemo } from 'react'
import { Flame } from 'lucide-react'
import { format, eachDayOfInterval, subMonths, isSameDay } from 'date-fns'

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
  
  const maxCount = Math.max(...Object.values(activityMap), 1)
  
  const getColor = (count) => {
    if (!count) return 'bg-void-700/30'
    const ratio = count / maxCount
    if (ratio < 0.2) return 'bg-electric-400/20'
    if (ratio < 0.4) return 'bg-electric-400/35'
    if (ratio < 0.6) return 'bg-electric-400/50'
    if (ratio < 0.8) return 'bg-electric-400/70'
    return 'bg-electric-400'
  }
  
  const totalActivities = Object.values(activityMap).reduce((a, b) => a + b, 0)
  const activeDays = Object.keys(activityMap).length
  
  return (
    <div className="bg-void-700/30 border border-void-600/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-400" />
          <span className="text-sm text-frost-100 font-medium">Activity Heatmap</span>
          <span className="text-xs text-frost-300/50">
            ({totalActivities} activities in {activeDays} days)
          </span>
        </div>
        
        {selectedDate && (
          <button 
            onClick={() => onDateSelect(null)} 
            className="text-xs text-electric-400 hover:text-electric-500 px-3 py-1.5 bg-electric-400/10 rounded-lg transition-colors"
          >
            Clear: {format(selectedDate, 'MMM d, yyyy')}
          </button>
        )}
      </div>
      
      {/* Heatmap Grid */}
      <div className="overflow-x-auto pb-2">
        <div className="flex gap-0.5 min-w-max">
          {days.map(day => {
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
                  w-3 h-3 rounded-sm transition-all
                  ${getColor(count)}
                  ${isSelected ? 'ring-2 ring-electric-400 ring-offset-1 ring-offset-void-900 scale-125' : ''}
                  ${isToday ? 'ring-1 ring-frost-300/30' : ''}
                  ${count > 0 ? 'cursor-pointer hover:scale-125 hover:ring-1 hover:ring-frost-300/30' : 'cursor-default'}
                `}
              />
            )
          })}
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex items-center justify-between mt-4 text-xs text-frost-300/50">
        <span>{format(startDate, 'MMM d')}</span>
        <div className="flex items-center gap-1">
          <span>Less</span>
          <div className="flex gap-0.5">
            <div className="w-3 h-3 bg-void-700/30 rounded-sm" />
            <div className="w-3 h-3 bg-electric-400/20 rounded-sm" />
            <div className="w-3 h-3 bg-electric-400/35 rounded-sm" />
            <div className="w-3 h-3 bg-electric-400/50 rounded-sm" />
            <div className="w-3 h-3 bg-electric-400/70 rounded-sm" />
            <div className="w-3 h-3 bg-electric-400 rounded-sm" />
          </div>
          <span>More</span>
        </div>
        <span>{format(today, 'MMM d')}</span>
      </div>
    </div>
  )
}

export default Heatmap

