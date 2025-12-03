import { useMemo } from 'react'
import { format, eachDayOfInterval, subDays, startOfWeek, getDay, isToday, isSameDay } from 'date-fns'

const WEEKS_TO_SHOW = 52 // Show 1 year of data

function getActivityLevel(count) {
  if (count === 0) return 0
  if (count <= 2) return 1
  if (count <= 5) return 2
  if (count <= 10) return 3
  return 4
}

const levelColors = {
  0: 'bg-void-700/50 hover:bg-void-600/50',
  1: 'bg-electric-400/20 hover:bg-electric-400/30',
  2: 'bg-electric-400/40 hover:bg-electric-400/50',
  3: 'bg-electric-400/60 hover:bg-electric-400/70',
  4: 'bg-electric-400 hover:bg-electric-500',
}

const levelLabels = ['No activity', '1-2 activities', '3-5 activities', '6-10 activities', '10+ activities']

export function HeatMap({ activities, selectedDate, onDateSelect }) {
  // Build activity count map
  const activityCountByDate = useMemo(() => {
    const counts = {}
    for (const activity of activities) {
      const dateKey = format(new Date(activity.date), 'yyyy-MM-dd')
      counts[dateKey] = (counts[dateKey] || 0) + 1
    }
    return counts
  }, [activities])

  // Generate calendar data
  const calendarData = useMemo(() => {
    const today = new Date()
    const endDate = today
    const startDate = subDays(today, WEEKS_TO_SHOW * 7)
    
    // Adjust start to beginning of week (Sunday)
    const adjustedStart = startOfWeek(startDate)
    
    const days = eachDayOfInterval({ start: adjustedStart, end: endDate })
    
    // Group by weeks
    const weeks = []
    let currentWeek = []
    
    for (const day of days) {
      if (currentWeek.length === 7) {
        weeks.push(currentWeek)
        currentWeek = []
      }
      
      const dateKey = format(day, 'yyyy-MM-dd')
      const count = activityCountByDate[dateKey] || 0
      
      currentWeek.push({
        date: day,
        dateKey,
        count,
        level: getActivityLevel(count),
        isToday: isToday(day),
        isSelected: selectedDate && isSameDay(day, selectedDate),
      })
    }
    
    if (currentWeek.length > 0) {
      weeks.push(currentWeek)
    }
    
    return weeks
  }, [activityCountByDate, selectedDate])

  // Calculate totals
  const totalActivities = activities.length
  const daysWithActivity = Object.keys(activityCountByDate).length
  const mostActiveDay = useMemo(() => {
    let maxCount = 0
    let maxDate = null
    for (const [dateKey, count] of Object.entries(activityCountByDate)) {
      if (count > maxCount) {
        maxCount = count
        maxDate = dateKey
      }
    }
    return maxDate ? { date: maxDate, count: maxCount } : null
  }, [activityCountByDate])

  const months = useMemo(() => {
    const monthLabels = []
    let lastMonth = -1
    
    calendarData.forEach((week, weekIndex) => {
      const firstDayOfWeek = week[0]
      if (firstDayOfWeek) {
        const month = firstDayOfWeek.date.getMonth()
        if (month !== lastMonth) {
          monthLabels.push({
            label: format(firstDayOfWeek.date, 'MMM'),
            weekIndex,
          })
          lastMonth = month
        }
      }
    })
    
    return monthLabels
  }, [calendarData])

  const handleDateClick = (day) => {
    if (day.count > 0) {
      if (selectedDate && isSameDay(day.date, selectedDate)) {
        onDateSelect(null) // Deselect if clicking the same date
      } else {
        onDateSelect(day.date)
      }
    }
  }

  return (
    <div className="bg-void-700/30 border border-void-600/50 rounded-2xl p-6 mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-display font-semibold text-frost-100 mb-1">
            Activity Heatmap
          </h2>
          <p className="text-sm text-frost-300/60">
            Click on a day to filter activities • {totalActivities} total activities across {daysWithActivity} days
          </p>
        </div>
        
        {mostActiveDay && (
          <div className="text-right hidden md:block">
            <p className="text-xs text-frost-300/60">Most active day</p>
            <p className="text-sm text-electric-400 font-medium">
              {format(new Date(mostActiveDay.date), 'MMM d, yyyy')} ({mostActiveDay.count} activities)
            </p>
          </div>
        )}
      </div>

      {/* Month labels */}
      <div className="flex mb-2 ml-8">
        <div className="flex" style={{ gap: '3px' }}>
          {calendarData.map((_, weekIndex) => {
            const monthLabel = months.find(m => m.weekIndex === weekIndex)
            return (
              <div 
                key={weekIndex} 
                className="w-3 text-xs text-frost-300/60"
              >
                {monthLabel?.label || ''}
              </div>
            )
          })}
        </div>
      </div>

      {/* Heatmap grid */}
      <div className="flex">
        {/* Day labels */}
        <div className="flex flex-col justify-around mr-2 text-xs text-frost-300/60" style={{ gap: '3px' }}>
          <span className="h-3">Sun</span>
          <span className="h-3"></span>
          <span className="h-3">Tue</span>
          <span className="h-3"></span>
          <span className="h-3">Thu</span>
          <span className="h-3"></span>
          <span className="h-3">Sat</span>
        </div>

        {/* Grid */}
        <div className="flex overflow-x-auto pb-2" style={{ gap: '3px' }}>
          {calendarData.map((week, weekIndex) => (
            <div key={weekIndex} className="flex flex-col" style={{ gap: '3px' }}>
              {week.map((day) => (
                <button
                  key={day.dateKey}
                  onClick={() => handleDateClick(day)}
                  disabled={day.count === 0}
                  className={`
                    w-3 h-3 rounded-sm transition-all duration-150
                    ${levelColors[day.level]}
                    ${day.isToday ? 'ring-1 ring-frost-300/50' : ''}
                    ${day.isSelected ? 'ring-2 ring-neon-pink ring-offset-1 ring-offset-void-900' : ''}
                    ${day.count > 0 ? 'cursor-pointer' : 'cursor-default'}
                  `}
                  title={`${format(day.date, 'EEEE, MMMM d, yyyy')}: ${day.count} ${day.count === 1 ? 'activity' : 'activities'}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-void-600/30">
        <div className="flex items-center gap-2 text-xs text-frost-300/60">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={`w-3 h-3 rounded-sm ${levelColors[level].split(' ')[0]}`}
              title={levelLabels[level]}
            />
          ))}
          <span>More</span>
        </div>
        
        {selectedDate && (
          <button
            onClick={() => onDateSelect(null)}
            className="text-xs text-electric-400 hover:text-electric-500 transition-colors"
          >
            Clear date filter ({format(selectedDate, 'MMM d')})
          </button>
        )}
      </div>
    </div>
  )
}

