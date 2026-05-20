import AdminGate from "@/components/AdminGate/AdminGate";

export default function AdminLayout({ children }) {
  return <AdminGate>{children}</AdminGate>;
}
