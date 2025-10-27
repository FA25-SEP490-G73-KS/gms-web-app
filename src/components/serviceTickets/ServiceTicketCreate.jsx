import React, { useEffect, useMemo, useRef, useState } from 'react';
import 'bootstrap-icons/font/bootstrap-icons.css';
import '../../styles/create-service.css';
import { useNavigate } from 'react-router-dom';

const initialState = {
  customerName: '',
  phone: '',
  vehicleType: '',
  licensePlate: '',
  chassisNumber: '',
  receiverStaff: '',
  receivedDate: '',
  vehicleCondition: '',
  customerRequest: '',
  notes: '',
};

export default function ServiceTicketCreate() {
  const [form, setForm] = useState(initialState);
  const [invalid, setInvalid] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [techs, setTechs] = useState([]);
  const [showTechDropdown, setShowTechDropdown] = useState(false);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const navigate = useNavigate();
  const techInputRef = useRef(null);

  useEffect(() => {
    // focus first input on mount
    const el = document.getElementById('customerName');
    el?.focus();

    // set today's date as default receivedDate (yyyy-mm-dd)
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setForm((prev) => ({ ...prev, receivedDate: `${yyyy}-${mm}-${dd}` }));

    // load technicians once
    fetch('http://localhost:8080/api/employees/technicians/active')
      .then(async (r) => {
        if (!r.ok) throw new Error(r.statusText);
        return r.json();
      })
      .then((data) => {
        const items = Array.isArray(data)
          ? data.map((d) => ({
              employeeId: d.employeeId ?? d.id ?? d.employeeID ?? 0,
              fullName: d.fullName ?? d.name ?? '',
              phone: d.phone ?? d.phoneNumber ?? '',
            }))
          : [];
        setTechs(items);
      })
      .catch((e) => {
        console.error('Failed to load technicians:', e);
      });
  }, []);

  const onChange = (e) => {
    const { id, value } = e.target;
    setForm((prev) => ({ ...prev, [id]: value }));

    if (id === 'receiverStaff') {
      setShowTechDropdown(true);
      setSelectedEmployeeId(null); // typing resets selection
    }
  };

  const validate = () => {
    const required = [
      'customerName',
      'phone',
      'vehicleType',
      'licensePlate',
      // 'receiverStaff',
      'receivedDate',
    ];
    const next = new Set();
    required.forEach((k) => {
      const v = String(form[k] || '').trim();
      if (!v) next.add(k);
    });
    setInvalid(next);
    return next.size === 0;
  };

  const filteredTechs = useMemo(() => {
    const q = form.receiverStaff.trim().toLowerCase();
    if (!q) return techs;
    return techs.filter((t) =>
      (t.fullName || '').toLowerCase().includes(q) || (t.phone || '').toLowerCase().includes(q)
    );
  }, [techs, form.receiverStaff]);

  const selectTechnician = (t) => {
    setForm((prev) => ({ ...prev, receiverStaff: t.fullName }));
    setSelectedEmployeeId(t.employeeId);
    setShowTechDropdown(false);
    // focus next field after selection
    const next = document.getElementById('receivedDate');
    next?.focus();
  };

  async function handleCreateTicket() {
    // Build payload according to provided sample
    const createdAt = new Date().toISOString();
    const payload = {
      appointmentId: null,
      customerId: null,
      vehicleId: null,
      status: 'DUYET',
      notes: form.notes?.trim() || null,
      createdAt,
      deliveryAt: null,
      fullName: form.customerName?.trim(),
      phone: form.phone?.trim(),
      zaloId: null,
      address: null,
      customerType: 'CA_NHAN',
      loyaltyLevel: 'NORMAL',
      licensePlate: form.licensePlate?.trim(),
      brand: form.vehicleType?.trim(),
      model: '',
      year: new Date().getFullYear(),
      vin: form.chassisNumber?.trim(),
      // extra metadata (not in sample, kept for backend if supported)
      receivingEmployeeId: selectedEmployeeId,
      receivedDateTime: createdAt,
    };

    const res = await fetch(
      'http://localhost:8080/api/service-tickets/new-service-tickets',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(text || res.statusText);
    }

    return res.json().catch(() => ({}));
  }

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      alert('Vui lòng điền đầy đủ các trường bắt buộc');
      return;
    }

    try {
      setSubmitting(true);
      const result = await handleCreateTicket();
      console.log('Create Service Ticket result:', result);
      alert('Tạo phiếu dịch vụ thành công!');
      // reset form
      setForm(initialState);
      setSelectedEmployeeId(null);
      setShowTechDropdown(false);
      // navigate to list
      navigate('/service-tickets', { replace: true });
    } catch (err) {
      console.error(err);
      alert(`Có lỗi xảy ra. Vui lòng thử lại!\n${err?.message || ''}`);
    } finally {
      setSubmitting(false);
    }
  };

  const onCancel = () => {
    navigate('/service-tickets');
  };

  // close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(ev) {
      if (!techInputRef.current) return;
      if (ev.target instanceof Node && !techInputRef.current.contains(ev.target)) {
        setShowTechDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="content-wrapper">
      <h3 className="title">PHIẾU DỊCH VỤ</h3>

      <form className="service-form" onSubmit={onSubmit} noValidate>
        <div className="form-left">
          <label htmlFor="customerName">Tên khách hàng:</label>
          <input
            id="customerName"
            type="text"
            value={form.customerName}
            onChange={onChange}
            style={{ borderColor: invalid.has('customerName') ? '#f28b82' : undefined }}
          />

          <label htmlFor="phone">Số điện thoại:</label>
          <input
            id="phone"
            type="tel"
            value={form.phone}
            onChange={onChange}
            style={{ borderColor: invalid.has('phone') ? '#f28b82' : undefined }}
          />

          <label htmlFor="vehicleType">Loại xe:</label>
          <input id="vehicleType" type="text" value={form.vehicleType} onChange={onChange} style={{ borderColor: invalid.has('vehicleType') ? '#f28b82' : undefined }} />

          <label htmlFor="licensePlate">Biển số xe:</label>
          <input id="licensePlate" type="text" value={form.licensePlate} onChange={onChange} />

          <label htmlFor="chassisNumber">Số khung:</label>
          <input id="chassisNumber" type="text" value={form.chassisNumber} onChange={onChange} />

          <label htmlFor="receiverStaff">Nhân viên tiếp nhận xe:</label>
          <div ref={techInputRef} style={{ position: 'relative' }}>
            <input
              id="receiverStaff"
              type="text"
              value={form.receiverStaff}
              onChange={onChange}
              autoComplete="off"
              style={{ borderColor: invalid.has('receiverStaff') ? '#f28b82' : undefined }}
              onFocus={() => setShowTechDropdown(true)}
            />
            {showTechDropdown && filteredTechs.length > 0 && (
              <ul
                style={{
                  position: 'absolute',
                  zIndex: 10,
                  background: '#fff',
                  border: '1px solid #ddd',
                  width: '100%',
                  maxHeight: 180,
                  overflowY: 'auto',
                  marginTop: 4,
                  listStyle: 'none',
                  paddingLeft: 0,
                }}
              >
                {filteredTechs.map((t) => (
                  <li
                    key={t.employeeId}
                    onMouseDown={(ev) => {
                      ev.preventDefault();
                      selectTechnician(t);
                    }}
                    style={{ padding: '6px 8px', cursor: 'pointer' }}
                  >
                    <span>{t.fullName}</span>
                    {t.phone ? <span style={{ color: '#666' }}> • {t.phone}</span> : null}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <label htmlFor="receivedDate">Ngày tiếp nhận xe:</label>
          <input id="receivedDate" type="date" value={form.receivedDate} onChange={onChange} style={{ borderColor: invalid.has('receivedDate') ? '#f28b82' : undefined }} />
        </div>

        <div className="form-right">
          <label htmlFor="notes">Ghi chú:</label>
          <textarea id="notes" rows={4} value={form.notes} onChange={onChange} />
        </div>
      </form>

      <div className="button-group">
        <button type="button" className="btn cancel" onClick={onCancel} disabled={submitting}>
          Hủy
        </button>
        <button type="submit" className="btn create" onClick={onSubmit} disabled={submitting}>
          {submitting ? 'Đang tạo...' : 'Tạo phiếu'}
        </button>
      </div>
    </div>
  );
}

