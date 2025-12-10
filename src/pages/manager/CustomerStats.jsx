import { useState } from 'react'
import ManagerLayout from '../../layouts/ManagerLayout'

import { Card, Select } from 'antd'
import { Line, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
)

const { Option } = Select

export default function ManagerCustomerStats() {
  const [revenueFilter, setRevenueFilter] = useState('year')
  const [expandedRows, setExpandedRows] = useState({})

  // Sample data for cards
  const statsCards = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CBB081" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
      ),
      label: 'Lợi Nhuận Ròng',
      value: '40',
      color: '#CBB081'
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CBB081" strokeWidth="2">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
        </svg>
      ),
      label: 'Tổng Thu',
      value: '20',
      color: '#CBB081'
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CBB081" strokeWidth="2">
          <line x1="12" y1="1" x2="12" y2="23"></line>
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
        </svg>
      ),
      label: 'Tổng Chi',
      value: '100,000,000 vnd',
      color: '#CBB081'
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#CBB081" strokeWidth="2">
          <circle cx="12" cy="12" r="10"></circle>
          <polyline points="12 6 12 12 16 14"></polyline>
        </svg>
      ),
      label: 'Tỷ suất Lợi nhuận Ròng',
      value: '10',
      color: '#CBB081'
    }
  ]

  // Line chart data
  const lineChartData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: '2021',
        data: [70, 20, 35, 20, 40, 30, 60, 20, 60, 60, 55, 40],
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0
      },
      {
        label: '2022',
        data: [40, 50, 40, 85, 20, 35, 20, 40, 40, 55, 80, 20],
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0
      }
    ]
  }

  // Doughnut chart data
  const doughnutData = {
    labels: ['Sửa chữa', 'Bảo dưỡng', 'Sơn', 'Bảo hành'],
    datasets: [
      {
        data: [60, 20, 20, 20],
        backgroundColor: ['#8B7355', '#D4A574', '#E8D5B7', '#6B5A4D'],
        borderWidth: 0
      }
    ]
  }

  const doughnutOptions = {
    plugins: {
      legend: {
        display: false
      }
    },
    cutout: '70%'
  }

  // Table data
  const tableData = [
    {
      category: 'TỔNG THU',
      amount: '1,500,000,000',
      percentage: '100%',
      comparison: '10%',
      expandable: true,
      children: [
        { name: 'Doanh thu dịch vụ', amount: '800,000,000', percentage: '53%' },
        { name: 'Doanh thu phụ tùng', amount: '500,000,000', percentage: '33%' },
        { name: 'Thu khác', amount: '200,000,000', percentage: '14%' }
      ]
    },
    {
      category: 'TỔNG CHI',
      amount: '600,000,000',
      percentage: '40%',
      comparison: '5%',
      expandable: true,
      children: [
        { name: 'Chi phí nhân công', amount: '300,000,000', percentage: '50%' },
        { name: 'Chi phí vật tư', amount: '200,000,000', percentage: '33%' },
        { name: 'Chi phí khác', amount: '100,000,000', percentage: '17%' }
      ]
    },
    {
      category: 'LỢI NHUẬN RÒNG',
      amount: '900,000,000',
      percentage: '60%',
      comparison: '15%',
      expandable: false
    }
  ]

  const toggleRow = (category) => {
    setExpandedRows(prev => ({
      ...prev,
      [category]: !prev[category]
    }))
  }

  return (
    <ManagerLayout>
      <div style={{ padding: '24px', background: '#f5f5f5', minHeight: '100vh' }}>
        {/* Stats Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(4, 1fr)', 
          gap: '16px', 
          marginBottom: '24px' 
        }}>
          {statsCards.map((card, index) => (
            <Card
              key={index}
              style={{
                borderRadius: '12px',
                border: 'none',
                boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                {card.icon}
                <span style={{ color: '#666', fontSize: '14px' }}>{card.label}</span>
              </div>
              <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937' }}>
                {card.value}
              </div>
            </Card>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px', marginBottom: '24px' }}>
          {/* Line Chart */}
          <Card
            title="Doanh thu"
            extra={
              <div style={{ display: 'flex', gap: '8px' }}>
                <Select
                  value={revenueFilter}
                  onChange={setRevenueFilter}
                  style={{ width: 120 }}
                  size="small"
                >
                  <Option value="quarter">Từ năm</Option>
                  <Option value="year">Đến năm</Option>
                </Select>
              </div>
            }
            style={{
              borderRadius: '12px',
              border: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            <Line 
              data={lineChartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: true,
                    position: 'bottom'
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    max: 100
                  }
                }
              }}
              height={250}
            />
          </Card>

          {/* Doughnut Chart */}
          <Card
            title="March 2025"
            extra={
              <div style={{ display: 'flex', gap: '4px' }}>
                <button style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>{'<'}</button>
                <button style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}>{'>'}</button>
              </div>
            }
            style={{
              borderRadius: '12px',
              border: 'none',
              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
            }}
          >
            <div style={{ position: 'relative', height: '200px', marginBottom: '20px' }}>
              <Doughnut data={doughnutData} options={doughnutOptions} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {doughnutData.labels.map((label, index) => (
                <div key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '12px',
                      height: '12px',
                      borderRadius: '50%',
                      background: doughnutData.datasets[0].backgroundColor[index]
                    }} />
                    <span style={{ fontSize: '14px', color: '#666' }}>{label}</span>
                  </div>
                  <span style={{ fontWeight: 600 }}>{doughnutData.datasets[0].data[index]}%</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Table */}
        <Card
          style={{
            borderRadius: '12px',
            border: 'none',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#CBB081' }}>
                <th style={{ padding: '16px', textAlign: 'left', color: '#fff', fontWeight: 600 }}>Hạng Mục</th>
                <th style={{ padding: '16px', textAlign: 'center', color: '#fff', fontWeight: 600 }}>Số Tiền</th>
                <th style={{ padding: '16px', textAlign: 'center', color: '#fff', fontWeight: 600 }}>Tỷ lệ (%)</th>
                <th style={{ padding: '16px', textAlign: 'center', color: '#fff', fontWeight: 600 }}>So với Kỳ trước</th>
              </tr>
            </thead>
            <tbody>
              {tableData.map((row, index) => (
                <>
                  <tr key={index} style={{ borderBottom: '1px solid #f0f0f0', background: index % 2 === 0 ? '#fafafa' : '#fff' }}>
                    <td style={{ padding: '16px', fontWeight: 600 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {row.expandable && (
                          <button
                            onClick={() => toggleRow(row.category)}
                            style={{
                              border: 'none',
                              background: 'transparent',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                          </button>
                        )}
                        {row.category}
                      </div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>{row.amount}</td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>{row.percentage}</td>
                    <td style={{ padding: '16px', textAlign: 'center' }}>{row.comparison}</td>
                  </tr>
                  {row.expandable && expandedRows[row.category] && row.children?.map((child, childIndex) => (
                    <tr key={`${index}-${childIndex}`} style={{ background: '#f9fafb', borderBottom: '1px solid #f0f0f0' }}>
                      <td style={{ padding: '12px 16px 12px 48px', fontSize: '14px', color: '#666' }}>{child.name}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px' }}>{child.amount}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '14px' }}>{child.percentage}</td>
                      <td style={{ padding: '12px 16px', textAlign: 'center' }}>-</td>
                    </tr>
                  ))}
                </>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </ManagerLayout>
  )
}


