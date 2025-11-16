import React from 'react'

// Common table header component with gold background (v2)image.png
export const goldTableHeader = {
  header: {
    cell: (props) => {
      return React.createElement('th', {
        ...props,
        style: {
          background: '#CBB081',
          fontWeight: 700,
          color: '#111',
          ...props.style
        }
      })
    }
  }
}
