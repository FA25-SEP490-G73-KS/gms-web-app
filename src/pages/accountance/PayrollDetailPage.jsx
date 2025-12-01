import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, Button, Tabs, message, Spin, Row, Col, Modal, Form, Input, InputNumber, Table, Tag } from 'antd'
import { PlusOutlined } from '@ant-design/icons'
import AccountanceLayout from '../../layouts/AccountanceLayout'
import { payrollAPI } from '../../services/api'
import { goldTableHeader } from '../../utils/tableComponents'
import { getUserIdFromToken } from '../../utils/helpers'
import dayjs from 'dayjs'
import '../../styles/pages/accountance/payroll-detail.css'

const { TextArea } = Input

export default function PayrollDetailPage() {
  const { employeeId, month, year } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [payrollDetail, setPayrollDetail] = useState(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [showAllowanceModal, setShowAllowanceModal] = useState(false)
  const [showDeductionModal, setShowDeductionModal] = useState(false)
  const [allowanceForm] = Form.useForm()
  const [deductionForm] = Form.useForm()
  const [submitting, setSubmitting] = useState(false)
  const [payingSalary, setPayingSalary] = useState(false)

  useEffect(() => {
    fetchPayrollDetail()
  }, [employeeId, month, year])

  const fetchPayrollDetail = async () => {
    if (!employeeId || !month || !year) return
    
    setLoading(true)
    try {
      const { data: response, error } = await payrollAPI.getDetail(
        parseInt(employeeId, 10),
        parseInt(month, 10),
        parseInt(year, 10)
      )
      
      if (error) {
        message.error('Không thể tải chi tiết lương')
        setLoading(false)
        return
      }

      setPayrollDetail(response?.result || null)
    } catch (err) {
      console.error('Failed to fetch payroll detail:', err)
      message.error('Đã xảy ra lỗi khi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return (amount || 0).toLocaleString('vi-VN')
  }

  const monthYear = month && year ? `${month}/${year}` : ''

  const handleCreateAllowance = async (values) => {
    if (!employeeId || !month || !year) return
    
    setSubmitting(true)
    try {
      const payload = {
        employeeId: parseInt(employeeId, 10),
        type: values.category || '', 
        amount: values.amount || 0
      }

      const { data: response, error } = await payrollAPI.createAllowance(payload)

      if (error) {
        message.error('Không thể tạo phụ cấp')
        return
      }

      message.success('Tạo phụ cấp thành công!')
      setShowAllowanceModal(false)
      allowanceForm.resetFields()
      fetchPayrollDetail()
    } catch (err) {
      console.error('Failed to create allowance:', err)
      message.error('Đã xảy ra lỗi khi tạo phụ cấp')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCreateDeduction = async (values) => {
    if (!employeeId || !month || !year) return
    
    setSubmitting(true)
    try {
      const payload = {
        employeeId: parseInt(employeeId, 10),
        type: values.category || '', 
        content: values.type || '', 
        amount: values.amount || 0
      }

      const { data: response, error } = await payrollAPI.createDeduction(payload)

      if (error) {
        message.error('Không thể tạo khấu trừ')
        return
      }

      message.success('Tạo khấu trừ thành công!')
      setShowDeductionModal(false)
      deductionForm.resetFields()
      fetchPayrollDetail()
    } catch (err) {
      console.error('Failed to create deduction:', err)
      message.error('Đã xảy ra lỗi khi tạo khấu trừ')
    } finally {
      setSubmitting(false)
    }
  }

  const allowanceColumns = [
    {
      title: 'Loại phụ cấp',
      dataIndex: 'type',
      key: 'type',
      align: 'left',
      render: (text) => text || 'N/A'
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      align: 'left',
      render: (value) => formatCurrency(value || 0)
    },
    {
      title: 'Ngày',
      dataIndex: 'createdAt',
      key: 'date',
      align: 'center',
      render: (value) => value ? dayjs(value).format('DD/MM/YYYY') : 'N/A'
    },
    {
      title: 'Trạng thái',
      key: 'status',
      align: 'center',
      render: () => (
        <Tag color="success">Hoàn tất</Tag>
      )
    }
  ]

  const handlePaySalary = async () => {
    if (!payrollDetail) return
    
    // Kiểm tra điều kiện: Payroll phải được APPROVED hoặc có canPaySalary = true
    const status = payrollDetail.status || ''
    const isApproved = 
      status === 'APPROVED' || 
      status === 'Duyệt' || 
      status === 'Đã duyệt' ||
      payrollDetail.canPaySalary === true
    
    if (!isApproved) {
      message.warning('Lương phải được quản lý duyệt trước khi chi lương')
      return
    }

    const accountantId = getUserIdFromToken()
    if (!accountantId) {
      message.error('Không thể lấy thông tin kế toán')
      return
    }

    // Lấy payroll ID từ params hoặc từ payrollDetail
    // Nếu không có payrollId trong response, dùng employeeId từ URL params
    const payrollId = payrollDetail.payrollId || payrollDetail.id || employeeId
    
    if (!payrollId) {
      message.error('Không tìm thấy thông tin lương để chi')
      return
    }

    setPayingSalary(true)
    try {
      const { data: response, error } = await payrollAPI.paySalary(
        payrollId,
        parseInt(accountantId, 10)
      )

      if (error) {
        message.error(error || 'Không thể chi lương')
        return
      }

      message.success('Chi lương thành công!')
      // Refresh dữ liệu sau khi chi lương
      fetchPayrollDetail()
    } catch (err) {
      console.error('Failed to pay salary:', err)
      message.error('Đã xảy ra lỗi khi chi lương')
    } finally {
      setPayingSalary(false)
    }
  }

  const deductionColumns = [
    {
      title: 'Loại khấu trừ',
      dataIndex: 'type',
      key: 'type',
      align: 'left',
      render: (text) => text || 'N/A'
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      align: 'left',
      render: (value) => formatCurrency(value || 0)
    },
    {
      title: 'Ngày',
      dataIndex: 'createdAt',
      key: 'date',
      align: 'center',
      render: (value) => value ? dayjs(value).format('DD/MM/YYYY') : 'N/A'
    },
    {
      title: 'Trạng thái',
      key: 'status',
      align: 'center',
      render: () => (
        <Tag color="success">Hoàn tất</Tag>
      )
    }
  ]

  return (
    <AccountanceLayout>
      <div className="payroll-detail-page">
        <div className="payroll-detail-header">
          <h1 className="payroll-detail-title">Chi tiết Lương tháng {monthYear}</h1>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin size="large" />
          </div>
        ) : payrollDetail ? (
          <>
            {/* Employee Information Card */}
            <Card className="employee-info-card">
              <Row gutter={24}>
                <Col span={12}>
                  <div className="info-item">
                    <span className="info-label">Tên nhân viên:</span>
                    <span className="info-value">{payrollDetail.employee?.fullName || 'N/A'}</span>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="info-item">
                    <span className="info-label">Số điện thoại:</span>
                    <span className="info-value">{payrollDetail.employee?.phone || 'N/A'}</span>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="info-item">
                    <span className="info-label">Địa chỉ:</span>
                    <span className="info-value">{payrollDetail.employee?.address || 'N/A'}</span>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="info-item">
                    <span className="info-label">Chức vụ:</span>
                    <span className="info-value">{payrollDetail.employee?.role || 'N/A'}</span>
                  </div>
                </Col>
              </Row>
            </Card>

            {/* Tabs */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <Tabs
                activeKey={activeTab}
                onChange={setActiveTab}
                items={[
                  { key: 'overview', label: 'Tổng quan' },
                  { key: 'allowances', label: 'Phụ cấp' },
                  { key: 'deductions', label: 'Khấu trừ' },
                ]}
                className="payroll-detail-tabs"
              />
              {(activeTab === 'allowances' || activeTab === 'deductions') && (
                <Button
                  type="default"
                  icon={<PlusOutlined />}
                  onClick={() => {
                    if (activeTab === 'allowances') {
                      setShowAllowanceModal(true)
                    } else {
                      setShowDeductionModal(true)
                    }
                  }}
                  className="add-item-btn"
                >
                  Thêm
                </Button>
              )}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <Row gutter={24} style={{ marginTop: '24px' }}>
                <Col span={12}>
                  <Card className="overview-card">
                    <div className="overview-item">
                      <span className="overview-label">Lương cơ bản:</span>
                      <span className="overview-value">{formatCurrency(payrollDetail.overview?.baseSalary || 0)}</span>
                    </div>
                    <div className="overview-item">
                      <span className="overview-label">Tổng công:</span>
                      <span className="overview-value">{payrollDetail.overview?.totalWorkingDays || 0}</span>
                    </div>
                    <div className="overview-item">
                      <span className="overview-label">Nghỉ phép:</span>
                      <span className="overview-value">{payrollDetail.overview?.leaveDays || payrollDetail.leaveDays || 0}</span>
                    </div>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card className="overview-card">
                    <div className="overview-item">
                      <span className="overview-label">Tổng khấu trừ:</span>
                      <span className="overview-value">{formatCurrency(payrollDetail.overview?.totalDeduction || 0)}</span>
                    </div>
                    <div className="overview-item">
                      <span className="overview-label">Tổng phụ cấp:</span>
                      <span className="overview-value">{formatCurrency(payrollDetail.overview?.totalAllowance || 0)}</span>
                    </div>
                    <div className="overview-item">
                      <span className="overview-label">Lương ròng:</span>
                      <span className="overview-value net-salary">{formatCurrency(payrollDetail.overview?.netSalary || 0)}</span>
                    </div>
                  </Card>
                </Col>
              </Row>
            )}

            {/* Allowances Tab */}
            {activeTab === 'allowances' && (
              <>
                <Card className="detail-table-card" style={{ marginTop: '24px' }}>
                  <Table
                    columns={allowanceColumns}
                    dataSource={payrollDetail.allowances || []}
                    rowKey={(record, index) => index}
                    pagination={false}
                    components={goldTableHeader}
                    locale={{
                      emptyText: 'Không có dữ liệu phụ cấp'
                    }}
                  />
                </Card>
                {payrollDetail.allowances && payrollDetail.allowances.length > 0 && (
                  <div className="total-section">
                    <span className="total-label">Tổng phụ cấp:</span>
                    <span className="total-amount positive">
                      +{formatCurrency(payrollDetail.allowances.reduce((sum, item) => sum + (item.amount || 0), 0))}
                    </span>
                  </div>
                )}
              </>
            )}

            {/* Deductions Tab */}
            {activeTab === 'deductions' && (
              <>
                <Card className="detail-table-card" style={{ marginTop: '24px' }}>
                  <Table
                    columns={deductionColumns}
                    dataSource={payrollDetail.deductions || []}
                    rowKey={(record, index) => index}
                    pagination={false}
                    components={goldTableHeader}
                    locale={{
                      emptyText: 'Không có dữ liệu khấu trừ'
                    }}
                  />
                </Card>
                {payrollDetail.deductions && payrollDetail.deductions.length > 0 && (
                  <div className="total-section">
                    <span className="total-label">Tổng khấu trừ:</span>
                    <span className="total-amount negative">
                      -{formatCurrency(payrollDetail.deductions.reduce((sum, item) => sum + (item.amount || 0), 0))}
                    </span>
                  </div>
                )}
              </>
            )}

            {/* Pay Salary Button */}
            <div className="pay-salary-section">
              <Button
                type="primary"
                size="large"
                className="pay-salary-btn"
                onClick={handlePaySalary}
                loading={payingSalary}
                disabled={
                  !payrollDetail ||
                  (payrollDetail.status !== 'APPROVED' && 
                   payrollDetail.status !== 'Duyệt' && 
                   payrollDetail.status !== 'Đã duyệt' &&
                   payrollDetail.canPaySalary !== true)
                }
              >
                Chi lương
              </Button>
            </div>

            {/* Create Allowance Modal */}
            <Modal
              title={<span style={{ color: '#fff' }}>Thông tin phụ cấp</span>}
              open={showAllowanceModal}
              onCancel={() => {
                setShowAllowanceModal(false)
                allowanceForm.resetFields()
              }}
              footer={null}
              width={500}
              className="payroll-modal"
              styles={{
                header: {
                  background: '#CBB081',
                  borderRadius: 0,
                  padding: '16px 24px',
                  margin: 0
                }
              }}
            >
              <Form
                form={allowanceForm}
                layout="vertical"
                onFinish={handleCreateAllowance}
              >
                <Form.Item
                  label={<span>Danh mục <span style={{ color: 'red' }}>*</span></span>}
                  name="category"
                  rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
                >
                  <select
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '8px 12px',
                      fontSize: '14px',
                      border: '1px solid #d9d9d9',
                      borderRadius: '8px',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#CBB081'
                      e.target.style.boxShadow = '0 0 0 2px rgba(203, 176, 129, 0.2)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d9d9d9'
                      e.target.style.boxShadow = 'none'
                    }}
                  >
                    <option value="">Chọn danh mục</option>
                    <option value="BONUS">Thưởng</option>
                    <option value="OVERTIME">Làm thêm giờ</option>
                    <option value="MEAL">Phụ cấp ăn</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </Form.Item>
                <Form.Item
                  label={<span>Nội dung <span style={{ color: 'red' }}>*</span></span>}
                  name="type"
                  rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}
                >
                  <TextArea
                    rows={3}
                    placeholder="VD: Phụ cấp tiền xăng"
                    style={{ resize: 'none' }}
                  />
                </Form.Item>
                <Form.Item
                  label={<span>Số tiền <span style={{ color: 'red' }}>*</span></span>}
                  name="amount"
                  rules={[{ required: true, message: 'Vui lòng nhập số tiền' }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="VD: 1000000"
                    min={0}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                  />
                </Form.Item>
                <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={submitting}
                      className="create-btn"
                    >
                      Tạo
                    </Button>
                  </div>
                </Form.Item>
              </Form>
            </Modal>

            {/* Create Deduction Modal */}
            <Modal
              title={<span style={{ color: '#fff' }}>Thông tin khấu trừ</span>}
              open={showDeductionModal}
              onCancel={() => {
                setShowDeductionModal(false)
                deductionForm.resetFields()
              }}
              footer={null}
              width={500}
              className="payroll-modal"
              styles={{
                header: {
                  background: '#CBB081',
                  borderRadius: 0,
                  padding: '16px 24px',
                  margin: 0
                }
              }}
            >
              <Form
                form={deductionForm}
                layout="vertical"
                onFinish={handleCreateDeduction}
              >
                <Form.Item
                  label={<span>Danh mục <span style={{ color: 'red' }}>*</span></span>}
                  name="category"
                  rules={[{ required: true, message: 'Vui lòng chọn danh mục' }]}
                >
                  <select
                    style={{
                      width: '100%',
                      height: '40px',
                      padding: '8px 12px',
                      fontSize: '14px',
                      border: '1px solid #d9d9d9',
                      borderRadius: '8px',
                      outline: 'none',
                      cursor: 'pointer'
                    }}
                    onFocus={(e) => {
                      e.target.style.borderColor = '#CBB081'
                      e.target.style.boxShadow = '0 0 0 2px rgba(203, 176, 129, 0.2)'
                    }}
                    onBlur={(e) => {
                      e.target.style.borderColor = '#d9d9d9'
                      e.target.style.boxShadow = 'none'
                    }}
                  >
                    <option value="">Chọn danh mục</option>
                    <option value="DAMAGE">Bồi thường hỏng hóc</option>
                    <option value="PENALTY">Phạt</option>
                    <option value="OTHER">Khác</option>
                  </select>
                </Form.Item>
                <Form.Item
                  label={<span>Nội dung <span style={{ color: 'red' }}>*</span></span>}
                  name="type"
                  rules={[{ required: true, message: 'Vui lòng nhập nội dung' }]}
                >
                  <TextArea
                    rows={3}
                    placeholder="VD: Phụ cấp tiền xăng"
                    style={{ resize: 'none' }}
                  />
                </Form.Item>
                <Form.Item
                  label={<span>Số tiền <span style={{ color: 'red' }}>*</span></span>}
                  name="amount"
                  rules={[{ required: true, message: 'Vui lòng nhập số tiền' }]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="VD: 500000"
                    min={0}
                    formatter={(value) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                    parser={(value) => value.replace(/\$\s?|(,*)/g, '')}
                  />
                </Form.Item>
                <Form.Item style={{ marginBottom: 0, marginTop: '24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={submitting}
                      className="create-btn"
                    >
                      Tạo
                    </Button>
                  </div>
                </Form.Item>
              </Form>
            </Modal>
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
            Không tìm thấy dữ liệu lương
          </div>
        )}
      </div>
    </AccountanceLayout>
  )
}

