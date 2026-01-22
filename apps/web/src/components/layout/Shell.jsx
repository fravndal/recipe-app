import { BottomNav } from "./BottomNav";
import { Header } from "./Header";

export function Shell({ children, title, showBack = false, showNav = true }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header title={title} showBack={showBack} />
      <main className={`flex-1 ${showNav ? "pb-20" : ""}`}>{children}</main>
      {showNav && <BottomNav />}
    </div>
  );
}
