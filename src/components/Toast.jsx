import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { CheckCircle, AlertCircle, AlertTriangle, Info, X, Wifi, WifiOff, Clock } from 'lucide-react'

const ToastContext = createContext(null)

const TOAST_TYPES = {
  success: {
    icon: CheckCircle,
    bg: 'bg-neon-green/10 border-neon-green/30',
    iconColor: 'text-neon-green',
    title: 'Success',
  },
  error: {
    icon: AlertCircle,
    bg: 'bg-red-500/10 border-red-500/30',
    iconColor: 'text-red-400',
    title: 'Error',
  },
  warning: {
    icon: AlertTriangle,
    bg: 'bg-yellow-500/10 border-yellow-500/30',
    iconColor: 'text-yellow-400',
    title: 'Warning',
  },
  info: {
    icon: Info,
    bg: 'bg-electric-400/10 border-electric-400/30',
    iconColor: 'text-electric-400',
    title: 'Info',
  },
  rateLimit: {
    icon: Clock,
    bg: 'bg-orange-500/10 border-orange-500/30',
    iconColor: 'text-orange-400',
    title: 'Rate Limited',
  },
  offline: {
    icon: WifiOff,
    bg: 'bg-red-500/10 border-red-500/30',
    iconColor: 'text-red-400',
    title: 'Offline',
  },
}

function Toast({ id, type = 'info', title, message, duration = 5000, onClose }) {
  const [isExiting, setIsExiting] = useState(false)
  const config = TOAST_TYPES[type] || TOAST_TYPES.info
  const Icon = config.icon

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsExiting(true)
        setTimeout(() => onClose(id), 300)
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [duration, id, onClose])

  const handleClose = () => {
    setIsExiting(true)
    setTimeout(() => onClose(id), 300)
  }

  return (
    <div
      className={`
        flex items-start gap-3 p-4 rounded-xl border backdrop-blur-xl shadow-2xl
        transform transition-all duration-300 ease-out min-w-[320px] max-w-[420px]
        ${config.bg}
        ${isExiting ? 'opacity-0 translate-x-full' : 'opacity-100 translate-x-0'}
      `}
    >
      <Icon className={`w-5 h-5 flex-shrink-0 mt-0.5 ${config.iconColor}`} />
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm ${config.iconColor}`}>
          {title || config.title}
        </p>
        {message && (
          <p className="text-xs text-frost-300/70 mt-1 break-words">
            {message}
          </p>
        )}
      </div>
      <button
        onClick={handleClose}
        className="p-1 hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
      >
        <X className="w-4 h-4 text-frost-300/60" />
      </button>
    </div>
  )
}

export function ToastContainer({ toasts, removeToast }) {
  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-3">
      {toasts.map((toast) => (
        <Toast key={toast.id} {...toast} onClose={removeToast} />
      ))}
    </div>
  )
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((options) => {
    const id = Date.now() + Math.random()
    setToasts((prev) => [...prev, { id, ...options }])
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback({
    success: (message, title) => addToast({ type: 'success', message, title }),
    error: (message, title) => addToast({ type: 'error', message, title }),
    warning: (message, title) => addToast({ type: 'warning', message, title }),
    info: (message, title) => addToast({ type: 'info', message, title }),
    rateLimit: (message) => addToast({ 
      type: 'rateLimit', 
      message: message || 'GitHub API rate limit exceeded. Please wait a moment.',
      duration: 8000 
    }),
    offline: () => addToast({ 
      type: 'offline', 
      message: 'Unable to connect. Check your internet connection.',
      duration: 0 // Don't auto-dismiss
    }),
    apiError: (error) => {
      // Parse common API errors
      if (error.includes('rate limit') || error.includes('403')) {
        return addToast({ type: 'rateLimit', message: 'GitHub API rate limit exceeded. Wait 1 minute.' })
      }
      if (error.includes('401') || error.includes('Unauthorized')) {
        return addToast({ type: 'error', title: 'Authentication Failed', message: 'Your token may have expired. Please re-login.' })
      }
      if (error.includes('404')) {
        return addToast({ type: 'warning', title: 'Not Found', message: 'The requested resource was not found.' })
      }
      if (error.includes('network') || error.includes('fetch')) {
        return addToast({ type: 'offline', message: 'Network error. Check your connection.' })
      }
      return addToast({ type: 'error', message: error })
    },
  }, [addToast])

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    // Return a no-op toast if not in provider (for safety)
    return {
      success: () => {},
      error: () => {},
      warning: () => {},
      info: () => {},
      rateLimit: () => {},
      offline: () => {},
      apiError: () => {},
    }
  }
  return context
}

