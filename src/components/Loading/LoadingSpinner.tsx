import React from 'react'
import "./LoadingSpinner.css"

interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large'
  color?: 'primary' | 'secondary' | 'white'
  message?: string
  showMessage?: boolean
  className?: string
  inline?: boolean
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'medium',
  color = 'primary',
  message,
  showMessage = true,
  className = '',
  inline = false
}) => {
  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'spinner--small'
      case 'large':
        return 'spinner--large'
      default:
        return 'spinner--medium'
    }
  }

  const getColorClasses = () => {
    switch (color) {
      case 'secondary':
        return 'spinner--secondary'
      case 'white':
        return 'spinner--white'
      default:
        return 'spinner--primary'
    }
  }

  const getAriaLabel = () => {
    if (message) return message
    if (showMessage) return 'Loading...'
    return 'Loading'
  }

  return (
    <div
      className={`loading-spinner ${getSizeClasses()} ${getColorClasses()} ${inline ? 'loading-spinner--inline' : ''} ${className}`}
      role="status"
      aria-label={getAriaLabel()}
      aria-busy="true"
    >
      <div className="spinner" aria-hidden="true">
        <div className="spinner-circle"></div>
        <div className="spinner-circle"></div>
        <div className="spinner-circle"></div>
        <div className="spinner-circle"></div>
      </div>

      {showMessage && message && (
        <div className="loading-message">
          {message}
        </div>
      )}

      {showMessage && !message && (
        <div className="loading-message">
          Loading...
        </div>
      )}

    </div>
  )
}

// Predefined loading states
export const LoadingStates = {
  FILE_UPLOAD: {
    message: 'Uploading file...',
    size: 'medium' as const,
    color: 'primary' as const
  },
  PARSING_JSON: {
    message: 'Parsing JSON content...',
    size: 'medium' as const,
    color: 'primary' as const
  },
  VALIDATING: {
    message: 'Validating file...',
    size: 'small' as const,
    color: 'secondary' as const
  },
  PROCESSING: {
    message: 'Processing...',
    size: 'large' as const,
    color: 'primary' as const
  },
  SEARCHING: {
    message: 'Searching...',
    size: 'small' as const,
    color: 'secondary' as const,
    inline: true
  }
} as const

// Convenience components for common loading states
export const FileUploadSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <LoadingSpinner
    {...LoadingStates.FILE_UPLOAD}
    className={className}
  />
)

export const JsonParsingSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <LoadingSpinner
    {...LoadingStates.PARSING_JSON}
    className={className}
  />
)

export const ValidatingSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <LoadingSpinner
    {...LoadingStates.VALIDATING}
    className={className}
  />
)

export const SearchingSpinner: React.FC<{ className?: string }> = ({ className }) => (
  <LoadingSpinner
    {...LoadingStates.SEARCHING}
    className={className}
  />
)

export default LoadingSpinner