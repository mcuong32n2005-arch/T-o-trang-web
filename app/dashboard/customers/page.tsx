"use client";

import React, { useEffect, useState } from "react";

interface Customer {
  id: string;
  _id?: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  status: string;
  note?: string;
  createdAt?: string;
}

// Helper: lấy ID đúng dù API trả về "id" hay "_id"
function getCustomerId(customer: Customer): string {
  return customer.id || customer._id || "";
}

const EMPTY_FORM = {
  name: "",
  phone: "",
  email: "",
  address: "",
  status: "Khách mới",
  note: "",
};

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/customers");
      const data = await res.json();
      // Chuẩn hóa: MongoDB trả về _id, đảm bảo luôn có trường id
      const raw: Customer[] = data.data || [];
      const normalized = raw.map((c: Customer) => ({
        ...c,
        id: c.id || c._id || "",
      }));
      setCustomers(normalized);
    } catch (error) {
      console.error("Lỗi tải danh sách khách hàng:", error);
      alert("Không tải được danh sách khách hàng. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const openAddForm = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEditForm = (customer: Customer) => {
    setEditingId(getCustomerId(customer));
    setForm({
      name: customer.name,
      phone: customer.phone,
      email: customer.email || "",
      address: customer.address || "",
      status: customer.status || "Khách mới",
      note: customer.note || "",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) {
      alert("Vui lòng nhập đầy đủ Họ tên và Số điện thoại!");
      return;
    }

    setSaving(true);
    try {
      const url = editingId ? `/api/customers/${editingId}` : "/api/customers";
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Có lỗi xảy ra, vui lòng thử lại.");
        return;
      }

      closeForm();
      await loadCustomers();
    } catch (error) {
      console.error("Lỗi lưu khách hàng:", error);
      alert("Không thể kết nối tới máy chủ. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (customer: Customer) => {
    const confirmed = window.confirm(`Xác nhận xoá khách hàng "${customer.name}"?`);
    if (!confirmed) return;

    const customerId = getCustomerId(customer);
    if (!customerId) {
      alert("Không xác định được mã khách hàng. Vui lòng tải lại trang.");
      return;
    }

    try {
      const res = await fetch(`/api/customers/${customerId}`, { method: "DELETE" });
      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Không xoá được khách hàng này.");
        return;
      }

      setCustomers((prev) => prev.filter((c) => getCustomerId(c) !== customerId));
    } catch (error) {
      console.error("Lỗi xoá khách hàng:", error);
      alert("Không thể kết nối tới máy chủ. Vui lòng thử lại.");
    }
  };

  return (
      <div className="space-y-6">
        <header className="flex justify-between items-center border-b border-gray-200 pb-5">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Quản lý khách hàng</h1>
            <p className="text-xs text-gray-500">Danh sách khách hàng lưu trong MongoDB — chỉ admin xem được.</p>
          </div>
          <button
              onClick={openAddForm}
              className="bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            ➕ Thêm khách hàng
          </button>
        </header>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
          {loading ? (
              <div className="p-10 text-center text-sm text-gray-400">Đang tải danh sách khách hàng...</div>
          ) : customers.length === 0 ? (
              <div className="p-10 text-center text-sm text-gray-400">Chưa có khách hàng nào. Bấm "Thêm khách hàng" để bắt đầu.</div>
          ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
                <tr>
                  <th className="text-left px-5 py-3">Họ tên</th>
                  <th className="text-left px-5 py-3">Điện thoại</th>
                  <th className="text-left px-5 py-3">Email</th>
                  <th className="text-left px-5 py-3">Trạng thái</th>
                  <th className="text-left px-5 py-3">Ghi chú</th>
                  <th className="text-right px-5 py-3">Hành động</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                {customers.map((customer) => (
                    <tr key={customer.id} className="hover:bg-gray-50/60 transition">
                      <td className="px-5 py-3 font-bold text-gray-800">{customer.name}</td>
                      <td className="px-5 py-3 text-gray-600 font-mono">{customer.phone}</td>
                      <td className="px-5 py-3 text-gray-600">{customer.email || "—"}</td>
                      <td className="px-5 py-3">
                    <span className="text-[10px] font-bold px-2 py-1 rounded-sm bg-teal-50 text-teal-700">
                      {customer.status}
                    </span>
                      </td>
                      <td className="px-5 py-3 text-gray-500 text-xs max-w-[200px] truncate">{customer.note || "—"}</td>
                      <td className="px-5 py-3 text-right space-x-2">
                        <button
                            onClick={() => openEditForm(customer)}
                            className="text-xs font-bold text-teal-700 hover:underline"
                        >
                          Sửa
                        </button>
                        <button
                            onClick={() => handleDelete(customer)}
                            className="text-xs font-bold text-red-600 hover:underline"
                        >
                          Xoá
                        </button>
                      </td>
                    </tr>
                ))}
                </tbody>
              </table>
          )}
        </div>

        {/* MODAL FORM THÊM / SỬA KHÁCH HÀNG */}
        {showForm && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-gray-100 p-6">
                <h3 className="font-bold text-teal-700 text-sm mb-4 flex items-center gap-2">
                  {editingId ? "✏️ SỬA THÔNG TIN KHÁCH HÀNG" : "⚙️ THÊM KHÁCH HÀNG MỚI"}
                </h3>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">Họ tên *</label>
                      <input
                          type="text"
                          value={form.name}
                          onChange={(e) => setForm({ ...form, name: e.target.value })}
                          className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">Số điện thoại *</label>
                      <input
                          type="text"
                          value={form.phone}
                          onChange={(e) => setForm({ ...form, phone: e.target.value })}
                          className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">Email</label>
                      <input
                          type="email"
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-gray-500 mb-1">Trạng thái</label>
                      <select
                          value={form.status}
                          onChange={(e) => setForm({ ...form, status: e.target.value })}
                          className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500 bg-white"
                      >
                        <option value="Khách mới">Khách mới</option>
                        <option value="Đang lưu trú">Đang lưu trú</option>
                        <option value="Đã từng ở">Đã từng ở</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">Địa chỉ</label>
                    <input
                        type="text"
                        value={form.address}
                        onChange={(e) => setForm({ ...form, address: e.target.value })}
                        className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-500 mb-1">Ghi chú</label>
                    <textarea
                        rows={2}
                        value={form.note}
                        onChange={(e) => setForm({ ...form, note: e.target.value })}
                        className="w-full text-xs p-2.5 border border-gray-200 rounded-lg focus:outline-teal-500"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                        type="button"
                        onClick={closeForm}
                        className="flex-1 border border-gray-200 text-gray-600 font-bold text-xs py-3 rounded-lg hover:bg-gray-50 transition"
                    >
                      Huỷ
                    </button>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 bg-teal-700 hover:bg-teal-800 disabled:opacity-60 text-white font-bold text-xs py-3 rounded-lg transition shadow-xs uppercase tracking-wider"
                    >
                      {saving ? "Đang lưu..." : editingId ? "Lưu thay đổi" : "Thêm khách hàng"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
        )}
      </div>
  );
}
