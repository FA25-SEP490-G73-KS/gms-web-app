import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Table, Input, Button, Tag, Space, message, Modal, Form, Row, Col } from 'antd'
import { SearchOutlined, ReloadOutlined, EditOutlined } from '@ant-design/icons'
import AdminLayout from '../../layouts/AdminLayout'
import { customersAPI } from '../../services/api'
import { goldTableHeader } from '../../utils/tableComponents'
import { normalizePhoneTo84, displayPhoneFrom84 } from '../../utils/helpers'

const loyaltyConfig = {
  BRONZE: { color: '#C3AA5E', text: 'Đồng' },
  // Hỗ trợ cả SLIVER (enum backend) và SILVER
  SLIVER: { color: '#99A8BC', text: 'Bạc' },
  SILVER: { color: '#99A8BC', text: 'Bạc' },
  GOLD: { color: '#d4af37', text: 'Vàng' }
}

const formatCustomer = (customer, index, pageIndex, pageSize) => ({
  id: customer.customerId ?? customer.id ?? null,
  fullName: customer.fullName || customer.name || 'Không rõ',
  phone: customer.phone || customer.phoneNumber || '—',
  vehicleCount: customer.vehicleCount || customer.vehicles?.length || 0,
  loyaltyLevel: (customer.loyaltyLevel || 'BRONZE').toUpperCase(),
  totalSpending: customer.totalSpending || customer.totalAmount || 0,
  isActive: customer.isActive !== false,
  key: customer.customerId ?? customer.id ?? `customer-${index}`,
  index: pageIndex * pageSize + index + 1
})

export default function AdminCustomers() {
  const [query, setQuery] = useState('')
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [total, setTotal] = useState(0)
  const [statusFilter, setStatusFilter] = useState('all')
  const didInit = useRef(false)
  const navigate = useNavigate()

  // Modal edit customer states
  const [editModalVisible, setEditModalVisible] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [customerVehicles, setCustomerVehicles] = useState([])
  const [loadingCustomerDetail, setLoadingCustomerDetail] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [form] = Form.useForm()

  const fetchCustomers = useCallback(
    async (pageIndex = 0, size = 10) => {
      setLoading(true)
      try {
        const { data, error } = await customersAPI.getAll(pageIndex, size)
        if (error) {
          throw new Error(error)
        }
        const payload = data?.result || data?.data || data
        const list = Array.isArray(payload)
          ? payload
          : payload?.content || payload?.items || payload?.records || []

        setCustomers(list.map((item, idx) => formatCustomer(item, idx, pageIndex, size)))
        setTotal(
          payload?.totalElements ||
            payload?.total ||
            payload?.totalItems ||
            list.length
        )
        setPage(pageIndex + 1)
        setPageSize(size)
      } catch (err) {
        message.error(err.message || 'Không thể tải danh sách khách hàng')
        setCustomers([])
        setTotal(0)
      } finally {
        setLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    if (!didInit.current) {
      fetchCustomers(0, pageSize)
      didInit.current = true
    }
  }, [fetchCustomers, pageSize])

  const filtered = useMemo(() => {
    return customers.filter((customer) => {
      const matchesQuery =
        !query ||
        customer.fullName.toLowerCase().includes(query.toLowerCase()) ||
        customer.phone.includes(query)

      const matchesStatus =
        statusFilter === 'all' ||
        (statusFilter === 'active' && customer.isActive) ||
        (statusFilter === 'inactive' && !customer.isActive)

      return matchesQuery && matchesStatus
    })
  }, [customers, query, statusFilter])

  const handleToggleStatus = (record) => {
    const actionText = record.isActive ? 'ngưng hoạt động' : 'kích hoạt'
    Modal.confirm({
      title: `Xác nhận ${actionText} tài khoản`,
      content: `Bạn có chắc chắn muốn ${actionText} tài khoản của ${record.fullName}?`,
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          const { error } = await customersAPI.toggleActive(record.id)

          if (error) {
            message.error(`Không thể ${actionText} tài khoản`)
            return
          }

          message.success(
            `${actionText.charAt(0).toUpperCase() + actionText.slice(1)} tài khoản thành công`
          )
          await fetchCustomers(page - 1, pageSize)
        } catch (error) {
          console.error('Toggle customer status error:', error)
          message.error(`Không thể ${actionText} tài khoản`)
        }
      }
    })
  }

  const handleEditCustomer = async (record) => {
    if (!record.id) {
      message.warning("Không tìm thấy ID khách hàng");
      return;
    }
  
    setLoadingCustomerDetail(true);
    setEditModalVisible(true);
  
    try {
      const { data, error } = await customersAPI.getById(record.id);
  
      if (error || !data?.result) {
        message.error("Không thể tải thông tin khách hàng");
        setEditModalVisible(false);
        return;
      }
  
      const customerData = data.result;
  
      // ⭐ ID CHUẨN LẤY TỪ BACKEND → luôn đúng
      const finalId = Number(customerData.customerId || customerData.id || record.id);
  
      if (!finalId || isNaN(finalId)) {
        message.error("ID khách hàng không hợp lệ");
        setEditModalVisible(false);
        return;
      }
  
      const customerWithId = {
        ...customerData,
        id: finalId,
        customerId: finalId,
        discountPolicyId: customerData.discountPolicyId ?? null,
      };
  
      setEditingCustomer(customerWithId);
  
      setCustomerVehicles(customerData.vehicles || []);
  
      form.setFieldsValue({
        fullName: customerData.fullName,
        phone: displayPhoneFrom84(customerData.phone || ""),
        address: customerData.address || "",
        loyaltyLevel: customerData.loyaltyLevel || "BRONZE",
      });
  
    } catch (err) {
      message.error("Không thể tải thông tin khách hàng");
      setEditModalVisible(false);
    } finally {
      setLoadingCustomerDetail(false);
    }
  };
  
  

  const handleUpdateCustomer = async () => {
    try {
      const values = await form.validateFields();
  
      // ⭐ LUÔN LẤY ID TỪ editingCustomer — VÌ ĐÃ SET CHẮC CHẮN
      const customerIdNum = Number(editingCustomer?.customerId || editingCustomer?.id);
  
      if (!customerIdNum || isNaN(customerIdNum)) {
        message.error("Không xác định được ID khách hàng");
        return;
      }
  
      setUpdating(true);
  
      const payload = {
        customerId: customerIdNum,
        fullName: values.fullName.trim(),
        phone: normalizePhoneTo84(values.phone.trim()),
        address: values.address.trim(),
        customerType: editingCustomer.customerType || "CA_NHAN",
      };
  
      if (editingCustomer.discountPolicyId != null)
        payload.discountPolicyId = editingCustomer.discountPolicyId;
  
      console.log("Payload gửi lên:", payload);
  
      const { error } = await customersAPI.update(customerIdNum, payload);
      if (error) throw new Error(error);
  
      message.success("Cập nhật khách hàng thành công");
  
      setEditModalVisible(false);
      form.resetFields();
      setEditingCustomer(null);
      setCustomerVehicles([]);
  
      await fetchCustomers(page - 1, pageSize);
  
    } catch (err) {
      if (!err?.errorFields) message.error(err.message || "Cập nhật khách hàng thất bại");
    } finally {
      setUpdating(false);
    }
  };
  
  
  

  const handleCancelEdit = () => {
    setEditModalVisible(false)
    form.resetFields()
    setEditingCustomer(null)
    setCustomerVehicles([])
  }

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('vi-VN').format(amount || 0)

  const columns = [
    {
      title: 'STT',
      dataIndex: 'index',
      key: 'index',
      width: 70,
      align: 'center',
      render: (text) => <span style={{ fontWeight: 600 }}>{text}</span>
    },
    {
      title: 'Tên Khách hàng',
      dataIndex: 'fullName',
      key: 'fullName',
      width: 200,
      render: (text) => <span style={{ fontWeight: 600 }}>{text}</span>
    },
    {
      title: 'Số điện thoại',
      dataIndex: 'phone',
      key: 'phone',
      width: 150
    },
    {
      title: 'Số xe',
      dataIndex: 'vehicleCount',
      key: 'vehicleCount',
      width: 100,
      align: 'center',
      render: (count) => <span>{count || 0}</span>
    },
    {
      title: 'Cấp độ thành viên',
      dataIndex: 'loyaltyLevel',
      key: 'loyaltyLevel',
      width: 160,
      render: (value) => {
        const config = loyaltyConfig[value] || loyaltyConfig.BRONZE
        return (
          <Tag
            style={{
              borderRadius: 999,
              padding: '4px 12px',
              fontWeight: 600,
              borderColor: config.color,
              color: config.color,
              background: 'transparent'
            }}
          >
            {config.text}
          </Tag>
        )
      }
    },
    {
      title: 'Tổng Chi tiêu',
      dataIndex: 'totalSpending',
      key: 'totalSpending',
      width: 150,
      align: 'right',
      render: (amount) => (
        <span style={{ fontWeight: 500 }}>{formatCurrency(amount)} đ</span>
      )
    },
    {
      title: 'Trạng thái',
      dataIndex: 'isActive',
      key: 'isActive',
      width: 120,
      align: 'center',
      render: (isActive) => (
        <span
          style={{
            color: isActive ? '#10b981' : '#ef4444',
            fontWeight: 500
          }}
        >
          {isActive ? 'Hoạt động' : 'Ngừng'}
        </span>
      )
    },
    {
      title: 'Hành động',
      key: 'action',
      width: 100,
      align: 'center',
      render: (_, record) => (
        <Button
          type="text"
          icon={<EditOutlined />}
          onClick={() => handleEditCustomer(record)}
          style={{ color: '#CBB081' }}
        />
      )
    }
  ]

  return (
    <AdminLayout>
      <div style={{ padding: 24, minHeight: '100vh', background: '#fff' }}>
        <div
          style={{
            background: '#fff',
            borderRadius: 16,
            padding: 24,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          <h1
            style={{
              marginBottom: 24,
              fontSize: 24,
              fontWeight: 600,
              color: '#1a1a1a'
            }}
          >
            Danh sách khách hàng
          </h1>

          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              marginBottom: 20
            }}
          >
            <Input
              allowClear
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              prefix={<SearchOutlined />}
              placeholder="Tìm kiếm"
              style={{ width: 280, height: 40 }}
            />

            <Space wrap>
              <Button
                type={statusFilter === 'all' ? 'primary' : 'default'}
                onClick={() => setStatusFilter('all')}
                style={{
                  background:
                    statusFilter === 'all' ? '#CBB081' : '#fff',
                  borderColor:
                    statusFilter === 'all' ? '#CBB081' : '#d9d9d9',
                  color: statusFilter === 'all' ? '#fff' : '#666',
                  fontWeight: 500,
                  borderRadius: 6,
                  height: 40
                }}
              >
                Tất cả
              </Button>
              <Button
                type={statusFilter === 'active' ? 'primary' : 'default'}
                onClick={() => setStatusFilter('active')}
                style={{
                  background:
                    statusFilter === 'active' ? '#CBB081' : '#fff',
                  borderColor:
                    statusFilter === 'active' ? '#CBB081' : '#d9d9d9',
                  color: statusFilter === 'active' ? '#fff' : '#666',
                  fontWeight: 500,
                  borderRadius: 6,
                  height: 40
                }}
              >
                Hoạt động
              </Button>
              <Button
                type={statusFilter === 'inactive' ? 'primary' : 'default'}
                onClick={() => setStatusFilter('inactive')}
                style={{
                  background:
                    statusFilter === 'inactive' ? '#CBB081' : '#fff',
                  borderColor:
                    statusFilter === 'inactive' ? '#CBB081' : '#d9d9d9',
                  color: statusFilter === 'inactive' ? '#fff' : '#666',
                  fontWeight: 500,
                  borderRadius: 6,
                  height: 40
                }}
              >
                Ngừng hoạt động
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => fetchCustomers(page - 1, pageSize)}
                style={{
                  borderRadius: 6,
                  height: 40
                }}
              >
                Làm mới
              </Button>
            </Space>
          </div>

          <Table
            columns={columns}
            dataSource={filtered}
            loading={loading}
            components={goldTableHeader}
            pagination={{
              current: page,
              pageSize,
              total,
              showSizeChanger: true,
              showTotal: (t) => `Tổng ${t} khách hàng`,
              pageSizeOptions: ['10', '20', '50', '100'],
              onChange: (current, size) => {
                fetchCustomers(current - 1, size)
              },
              onShowSizeChange: (current, size) => {
                fetchCustomers(0, size)
              }
            }}
            onRow={(record) => ({
              onDoubleClick: () =>
                record.id &&
                navigate(`/service-advisor/customers/${record.id}`),
              style: { cursor: 'pointer' }
            })}
          />
        </div>
      </div>

      {/* Modal Edit Customer */}
      <Modal
        title="Thông tin chi tiết khách hàng"
        open={editModalVisible}
        onCancel={handleCancelEdit}
        onOk={handleUpdateCustomer}
        okText="Cập nhật"
        cancelText="Hủy"
        width={900}
        confirmLoading={updating}
      >
        {loadingCustomerDetail ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            Đang tải...
          </div>
        ) : (
          <Form form={form} layout="vertical" style={{ marginTop: 20 }}>
            <div
              style={{
                background: '#f5f5f5',
                padding: '20px',
                borderRadius: '8px',
                marginBottom: '24px'
              }}
            >
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item
                    label="Tên khách hàng"
                    name="fullName"
                    rules={[
                      { required: true, message: 'Vui lòng nhập tên khách hàng' },
                      {
                        max: 50,
                        message:
                          'Tên khách hàng không được vượt quá 50 ký tự'
                      }
                    ]}
                    style={{ marginBottom: 16 }}
                  >
                    <Input
                      placeholder="Nhập tên khách hàng"
                      maxLength={50}
                      showCount
                      onInput={(e) => {
                        if (e.target.value.length > 50) {
                          e.target.value = e.target.value.slice(0, 50)
                        }
                      }}
                    />
                  </Form.Item>
                  <Form.Item
                    label="Địa chỉ"
                    name="address"
                    rules={[
                      {
                        max: 100,
                        message: 'Địa chỉ không được vượt quá 100 ký tự'
                      }
                    ]}
                  >
                    <Input
                      placeholder="Nhập địa chỉ"
                      maxLength={100}
                      showCount
                      onInput={(e) => {
                        if (e.target.value.length > 100) {
                          e.target.value = e.target.value.slice(0, 100)
                        }
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    label="Số điện thoại"
                    name="phone"
                    rules={[
                      { required: true, message: 'Vui lòng nhập số điện thoại' },
                      {
                        pattern: /^0\d{9}$/,
                        message:
                          'Số điện thoại phải có 10 số và bắt đầu bằng 0'
                      }
                    ]}
                    style={{ marginBottom: 16 }}
                  >
                    <Input
                      placeholder="Nhập số điện thoại"
                      maxLength={10}
                      onInput={(e) => {
                        e.target.value = e.target.value.replace(/[^0-9]/g, '')
                        if (e.target.value.length > 10) {
                          e.target.value = e.target.value.slice(0, 10)
                        }
                        if (
                          e.target.value.length > 0 &&
                          e.target.value[0] !== '0'
                        ) {
                          e.target.value =
                            '0' + e.target.value.replace(/^0+/, '')
                        }
                      }}
                    />
                  </Form.Item>
                  <Form.Item label="Cấp độ thành viên" name="loyaltyLevel">
                    <Input
                      disabled
                      value={
                        editingCustomer
                          ? loyaltyConfig[
                              editingCustomer.loyaltyLevel?.toUpperCase()
                            ]?.text || 'Đồng'
                          : ''
                      }
                      style={{
                        backgroundColor: '#f5f5f5',
                        cursor: 'not-allowed'
                      }}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </div>

            {customerVehicles.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <h3
                  style={{
                    marginBottom: 16,
                    fontSize: 16,
                    fontWeight: 600
                  }}
                >
                  Danh sách xe của khách hàng
                </h3>
                <Table
                  dataSource={customerVehicles.map((vehicle, index) => ({
                    key: vehicle.vehicleId || vehicle.id || index,
                    index: index + 1,
                    licensePlate:
                      vehicle.licensePlate || vehicle.plate || '—',
                    brandName:
                      vehicle.brandName || vehicle.brand?.name || '—',
                    modelName:
                      vehicle.vehicleModelName || vehicle.modelName || vehicle.model?.name || vehicle.model?.vehicleModelName || '—',
                    year: vehicle.year || '—',
                    vin: vehicle.vin || '—'
                  }))}
                  columns={[
                    {
                      title: 'STT',
                      dataIndex: 'index',
                      key: 'index',
                      width: 70,
                      align: 'center'
                    },
                    {
                      title: 'Biển số xe',
                      dataIndex: 'licensePlate',
                      key: 'licensePlate',
                      width: 150
                    },
                    {
                      title: 'Hãng xe',
                      dataIndex: 'brandName',
                      key: 'brandName',
                      width: 150
                    },
                    {
                      title: 'Dòng xe',
                      dataIndex: 'modelName',
                      key: 'modelName',
                      width: 150
                    },
                    {
                      title: 'Năm sản xuất',
                      dataIndex: 'year',
                      key: 'year',
                      width: 120,
                      align: 'center'
                    },
                    {
                      title: 'Số khung',
                      dataIndex: 'vin',
                      key: 'vin',
                      width: 200
                    }
                  ]}
                  pagination={false}
                  size="small"
                  style={{
                    backgroundColor: '#fff'
                  }}
                />
              </div>
            )}
          </Form>
        )}
      </Modal>
    </AdminLayout>
  )
}
