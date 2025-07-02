import React from "react";
import Link from "next/link";

const menuItems = [
  {
    label: "Overview",
    href: "/",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
      >
        <path
          fill="currentColor"
          d="M17 20q-.425 0-.712-.288T16 19v-5q0-.425.288-.712T17 13h2q.425 0 .713.288T20 14v5q0 .425-.288.713T19 20zm-6 0q-.425 0-.712-.288T10 19V5q0-.425.288-.712T11 4h2q.425 0 .713.288T14 5v14q0 .425-.288.713T13 20zm-6 0q-.425 0-.712-.288T4 19v-9q0-.425.288-.712T5 9h2q.425 0 .713.288T8 10v9q0 .425-.288.713T7 20z"
        />
      </svg>
    ),
  },
  {
    label: "Prediksi Harga",
    href: "/prediksi-harga",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
      >
        <path
          fill="currentColor"
          d="m7.4 16l3.05-3.05l2 2L16 11.425V13h2V8h-5v2h1.575l-2.125 2.125l-2-2L6 14.6zM5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21zm0-2h14V5H5zM5 5v14z"
        />
      </svg>
    ),
  },
  {
    label: "Data Historis",
    href: "/data-historis",
    icon: (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
      >
        <path
          fill="currentColor"
          d="M19 21H5q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21M5 8h14V5H5zm2.5 2H5v9h2.5zm9 0v9H19v-9zm-2 0h-5v9h5z"
        />
      </svg>
    ),
  },
];

const Sidebar = () => {
  return (
    <div className="bg-gradient-to-b from-slate-800 to-slate-900 min-h-screen w-64 shadow-lg">
      {/* Header */}
      <div className="w-full h-16 px-5 items-center flex bg-gradient-to-r from-emerald-600 to-green-600 shadow-md">
        <div className="bg-white p-2 rounded-lg shadow-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
          >
            <path
              fill="#059669"
              d="M7 17h2v-7H7zm4 0h2V7h-2zm4 0h2v-4h-2zM3 21V3h18v18zm2-2h14V5H5zm0 0V5z"
            />
          </svg>
        </div>
        <p className="font-sans font-bold pl-5 text-white text-lg">RiceTrend</p>
      </div>

      {/* Navigation Menu */}
      <div className="flex flex-col gap-4 px-6 mt-8">
        {menuItems.map((item, index) => (
          <Link href={item.href} key={index}>
            <div className="font-sans flex gap-4 items-center text-gray-300 hover:text-white hover:bg-slate-700 p-3 rounded-lg transition-all duration-200 cursor-pointer group">
              <div className="text-emerald-400 group-hover:text-emerald-300 transition-colors duration-200">
                {item.icon}
              </div>
              <span className="text-sm font-medium">{item.label}</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Footer Info */}
      <div className="absolute bottom-6 left-6 right-6">
        <div className="bg-slate-700 p-4 rounded-lg border border-slate-600">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-emerald-400 text-xs font-medium">Status Online</span>
          </div>
          <p className="text-gray-400 text-xs">
            Data harga beras real-time
          </p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;