import { useNotifications } from '../hooks/useNotifications'

export function NotificationCenter() {
  const { notifications, unreadCount, markAsRead } = useNotifications()

  return (
    <div className="notification-center">
      <div className="notification-badge">
        {unreadCount > 0 && <span>{unreadCount}</span>}
      </div>
      
      <div className="notification-list">
        {notifications.map(notification => (
          <div 
            key={notification.id}
            className={`notification-item ${notification.read ? 'read' : 'unread'}`}
            onClick={() => markAsRead(notification.id)}
          >
            <h4>{notification.title}</h4>
            <p>{notification.message}</p>
            <small>{new Date(notification.created_at).toLocaleString()}</small>
          </div>
        ))}
      </div>
    </div>
  )
} 