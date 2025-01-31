import Sidebar from "@/components/notetaker/sidebar";

export default function NotetakerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col bg-background">
        {children}
      </div>
    </div>
  );
}
