"use client";

import React, { useEffect, useState } from "react";

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: string;
  isBanned: boolean;
  createdAt: string;
}

const ROLE_OPTIONS = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Manager" },
  { value: "staff", label: "Staff" },
  { value: "customer", label: "Customer" },
];

const ROLE_BADGE: Record<string, string> = {
  admin: "bg-red-50 text-red-700",
  manager: "bg-purple-50 text-purple-700",
  staff: "bg-sky-50 text-sky-700",
  customer: "bg-gray-100 text-gray-600",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      const data = await res.json();
      setUsers(data.data || []);
    } catch (error) {
      console.error("Lỗi tải danh sách người dùng:", error);
      alert("Không tải được danh sách người dùng.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (user: AppUser, role: string) => {
    setBusyId(user.id);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Không thể đổi vai trò.");
        return;
      }
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, role } : u)));
    } catch (error) {
      console.error("Lỗi đổi vai trò:", error);
      alert("Không thể kết nối tới máy chủ.");
    } finally {
      setBusyId(null);
    }
  };

  const handleToggleBan = async (user: AppUser) => {
    setBusyId(user.id);
    try {
      const res = await fetch(`/api/users/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isBanned: !user.isBanned }),
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Không thể đổi trạng thái khoá.");
        return;
      }
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, isBanned: !user.isBanned } : u)));
    } catch (error) {
      console.error("Lỗi khoá/mở khoá người dùng:", error);
      alert("Không thể kết nối tới máy chủ.");
    } finally {
      setBusyId(null);
    }
  };

  const handleDelete = async (user: AppUser) => {
    if (!window.confirm(`Xác nhận xoá tài khoản "${user.name}"?`)) return;
    setBusyId(user.id);
    try {
      const res = await fetch(`/api/users/${user.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || "Không xoá được người dùng này.");
        return;
      }
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
    } catch (error) {
      console.error("Lỗi xoá người dùng:", error);
      alert("Không thể kết nối tới máy chủ.");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <header className="border-b border-gray-200 pb-5">
        <h1 className="text-xl font-bold text-gray-800">Quản lý người dùng</h1>
        <p className="text-xs text-gray-500">Phân quyền và quản lý tài khoản qua Clerk.</p>
      </header>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-sm text-gray-400">Đang tải danh sách người dùng...</div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center text-sm text-gray-400">Chưa có người dùng nào.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="text-left px-5 py-3">Tên</th>
                <th className="text-left px-5 py-3">Email</th>
                <th className="text-left px-5 py-3">Vai trò</th>
                <th className="text-left px-5 py-3">Trạng thái</th>
                <th className="text-right px-5 py-3">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50/60 transition">
                  <td className="px-5 py-3 font-bold text-gray-800">{u.name}</td>
                  <td className="px-5 py-3 text-gray-600">{u.email}</td>
                  <td className="px-5 py-3">
                    <select
                      value={u.role}
                      disabled={busyId === u.id}
                      onChange={(e) => handleRoleChange(u, e.target.value)}
                      className={`text-[11px] font-bold px-2 py-1 rounded-sm border-0 ${ROLE_BADGE[u.role] || "bg-gray-100"}`}
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`text-[10px] font-bold px-2 py-1 rounded-sm ${
                        u.isBanned ? "bg-red-50 text-red-600" : "bg-emerald-50 text-emerald-700"
                      }`}
                    >
                      {u.isBanned ? "Đã khoá" : "Hoạt động"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => handleToggleBan(u)}
                      disabled={busyId === u.id}
                      className="text-xs font-bold text-amber-600 hover:underline disabled:opacity-50"
                    >
                      {u.isBanned ? "Mở khoá" : "Khoá"}
                    </button>
                    <button
                      onClick={() => handleDelete(u)}
                      disabled={busyId === u.id}
                      className="text-xs font-bold text-red-600 hover:underline disabled:opacity-50"
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
    </div>
  );
}
