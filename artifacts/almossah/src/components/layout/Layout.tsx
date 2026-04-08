import { Header } from "./Header";
import { Footer } from "./Footer";
import { BottomNav } from "./BottomNav";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <div className="flex flex-col min-h-screen font-sans">
      <Header />
      <main className="flex-1 pb-24">{children}</main>
      <Footer />
      <BottomNav />
    </div>
  );
}
