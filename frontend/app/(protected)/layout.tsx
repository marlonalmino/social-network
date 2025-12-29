import Protected from "@/components/Protected";
import Navbar from "@/components/Navbar";

export default function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <Protected>
      <Navbar />
      <div className="mx-auto max-w-3xl px-4 py-6">{children}</div>
    </Protected>
  );
}

