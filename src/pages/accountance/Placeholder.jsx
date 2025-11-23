import AccountanceLayout from '../../layouts/AccountanceLayout'

export default function AccountancePlaceholder({ title }) {
  return (
    <AccountanceLayout>
      <div style={{ padding: 24, background: '#f5f7fb', minHeight: '100vh' }}>
        <div
          style={{
            background: '#fff',
            borderRadius: 12,
            padding: 40,
            textAlign: 'center',
            fontSize: 18,
            color: '#999'
          }}
        >
          {title} đang được phát triển.
        </div>
      </div>
    </AccountanceLayout>
  )
}

