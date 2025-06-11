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
          fill="#7c7c7c"
          d="M17 20q-.425 0-.712-.288T16 19v-5q0-.425.288-.712T17 13h2q.425 0 .713.288T20 14v5q0 .425-.288.713T19 20zm-6 0q-.425 0-.712-.288T10 19V5q0-.425.288-.712T11 4h2q.425 0 .713.288T14 5v14q0 .425-.288.713T13 20zm-6 0q-.425 0-.712-.288T4 19v-9q0-.425.288-.712T5 9h2q.425 0 .713.288T8 10v9q0 .425-.288.713T7 20z"
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
          fill="#7c7c7c"
          d="m7.4 16l3.05-3.05l2 2L16 11.425V13h2V8h-5v2h1.575l-2.125 2.125l-2-2L6 14.6zM5 21q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21zm0-2h14V5H5zM5 5v14z"
        />
      </svg>
    ),
  },
  // {
  //   label: "Analisis",
  //   href: "/analisis",
  //   icon: (
  //     <svg
  //       xmlns="http://www.w3.org/2000/svg"
  //       width="24"
  //       height="24"
  //       viewBox="0 0 24 24"
  //     >
  //       <path
  //         fill="#7c7c7c"
  //         d="M3.5 18.5L2 17l7.5-7.5l4 4l7.1-8L22 6.9l-8.5 9.6l-4-4z"
  //       />
  //     </svg>
  //   ),
  // },
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
          fill="#7c7c7c"
          d="M19 21H5q-.825 0-1.412-.587T3 19V5q0-.825.588-1.412T5 3h14q.825 0 1.413.588T21 5v14q0 .825-.587 1.413T19 21M5 8h14V5H5zm2.5 2H5v9h2.5zm9 0v9H19v-9zm-2 0h-5v9h5z"
        />
      </svg>
    ),
  },
];
const Sidebar = () => {
  return (
    <div className="">
      <div className="w-full h-15 pl-5 items-center flex shadow-sm">
        {/* <Image
          src='/rice.jpg'
          alt='trend'
          width={20}
          height={20}
          className='w-10'
        /> */}
        <div className="bg-black">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
          >
            <path
              fill="#fff"
              d="M7 17h2v-7H7zm4 0h2V7h-2zm4 0h2v-4h-2zM3 21V3h18v18zm2-2h14V5H5zm0 0V5z"
            />
          </svg>
        </div>
        <p className="font-sans font-bold pl-5 ">RiceTrend</p>
      </div>
      <div className="flex flex-col gap-10 pl-10 mt-10">
        {menuItems.map((item, index) => (
          <Link href={item.href} key={index}>
            <div
              className="font-sans flex gap-5  items-center text-gray-500"
            >
              {item.icon}
              {item.label}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
