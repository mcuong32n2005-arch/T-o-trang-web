"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

type SidebarLink = {
    label: string;
    href: string;
};

type SidebarGroup = {
    label: string;
    href?: string; // optional: clicking the group title itself navigates somewhere
    items?: SidebarLink[];
};

const SIDEBAR_GROUPS: SidebarGroup[] = [
    {
        label: "Hướng dẫn đặt phòng",
        items: [
            { label: "Hướng dẫn tìm phòng", href: "/search" },
            { label: "Hướng dẫn đặt phòng", href: "/booking" },
            { label: "Hướng dẫn chỉnh sửa đơn đặt phòng", href: "/booking" },
            { label: "Hướng dẫn hủy đơn đặt phòng", href: "/booking" },
            { label: "Các loại giá, phí khách cần biết", href: "/marketplace-rules" },
        ],
    },
    {
        label: "Hướng dẫn thanh toán",
        items: [
            { label: "Hướng dẫn thanh toán bằng VNPAY", href: "/payment-policy" },
            { label: "Chính sách hoàn tiền", href: "/payment-policy" },
        ],
    },
    {
        label: "Đăng ký thành viên",
        items: [
            { label: "Hướng dẫn đăng ký - đăng nhập", href: "/sign-up" },
            { label: "Hướng dẫn lấy lại mật khẩu", href: "/sign-in" },
            { label: "Xoá tài khoản", href: "/account" },
        ],
    },
    {
        label: "Hướng dẫn quản lý tài khoản",
        href: "/account",
    },
    {
        label: "Khiếu nại & hỗ trợ",
        items: [
            { label: "Gửi khiếu nại", href: "/complaints" },
            { label: "Liên hệ hỗ trợ", href: "/contact" },
        ],
    },
    {
        label: "Chính sách & quy định",
        items: [
            { label: "Quy định chợ Bảo An", href: "/marketplace-rules" },
            { label: "Chính sách bảo mật", href: "/privacy" },
            { label: "Điều khoản dịch vụ", href: "/terms" },
        ],
    },
    {
        label: "Câu hỏi thường gặp",
        href: "/faq",
    },
];

function ChevronIcon({ open }: { open: boolean }) {
    return (
        <svg
            className={`w-4 h-4 shrink-0 text-gray-400 transition-transform duration-200 ${
                open ? "rotate-90" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
        >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
    );
}

export default function HelpSidebar() {
    const pathname = usePathname();

    const groupContainsActive = (group: SidebarGroup) => {
        if (group.href && pathname?.startsWith(group.href)) return true;
        return group.items?.some((item) => pathname?.startsWith(item.href)) ?? false;
    };

    const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
        const initial: Record<string, boolean> = {};
        SIDEBAR_GROUPS.forEach((group) => {
            if (group.items && groupContainsActive(group)) {
                initial[group.label] = true;
            }
        });
        return initial;
    });

    const toggleGroup = (label: string) => {
        setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
    };

    return (
        <nav className="space-y-3" aria-label="Trợ giúp Bảo An Homestay">
            {SIDEBAR_GROUPS.map((group) => {
                const hasItems = !!group.items?.length;
                const isOpen = hasItems && !!openGroups[group.label];
                const groupActive = !hasItems && group.href && pathname?.startsWith(group.href);

                return (
                    <div
                        key={group.label}
                        className="rounded-xl border border-gray-200 bg-white overflow-hidden"
                    >
                        {hasItems ? (
                            <button
                                type="button"
                                onClick={() => toggleGroup(group.label)}
                                aria-expanded={isOpen}
                                className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium text-gray-900 hover:bg-gray-50 transition"
                            >
                                <span>{group.label}</span>
                                <ChevronIcon open={isOpen} />
                            </button>
                        ) : (
                            <Link
                                href={group.href ?? "#"}
                                className={`w-full flex items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium transition hover:bg-gray-50 ${
                                    groupActive ? "text-green-700" : "text-gray-900"
                                }`}
                            >
                                <span>{group.label}</span>
                                <ChevronIcon open={false} />
                            </Link>
                        )}

                        {hasItems && isOpen && (
                            <div className="border-t border-gray-100">
                                {group.items!.map((item) => {
                                    const active = pathname?.startsWith(item.href);
                                    return (
                                        <Link
                                            key={item.label}
                                            href={item.href}
                                            className={`block px-4 py-3 text-sm border-l-2 transition ${
                                                active
                                                    ? "border-green-600 text-green-700 font-medium bg-green-50/60"
                                                    : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                                            }`}
                                        >
                                            {item.label}
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                );
            })}
        </nav>
    );
}
