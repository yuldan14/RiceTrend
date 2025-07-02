import Dashboard from "@/components/Dashboard";
import Perbandingan from "@/components/Perbandingan";
import Sidebar from "@/components/Sidebar";

export default function Home() {
  return (
    <div className="overflow-x-hidden">
      {/* Sidebar fixed */}
      <div className="fixed z-50 h-screen w-64 shadow-xl bg-cyan-600">
        <Sidebar />
      </div>

      {/* Konten utama dengan margin kiri agar tidak ketindih */}
      <div className="ml-64">
        <Dashboard />
      </div>

      <div className="ml-64 ">
        <Perbandingan/>
      </div>
    </div>
  );
}
