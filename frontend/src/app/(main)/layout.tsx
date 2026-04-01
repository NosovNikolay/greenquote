import { AppHeader } from "@/components/app-header";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AppHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
    </>
  );
}
