import { NavLink, Outlet, useLocation } from "react-router-dom";
import { Home, MessageCircle, User, Plus } from "lucide-react";

const navItems = [
  { to: "/home", label: "Home", icon: Home },
  { to: "/inbox", label: "Messages", icon: MessageCircle },
  { to: "/profile", label: "Profile", icon: User },
];

export default function AppLayout() {
  const { pathname } = useLocation();
  const hideNav = pathname === "/login" || pathname === "/signup";

  return (
    <div className="app-frame pb-28">
      <Outlet />
      {!hideNav && (
        <nav className="app-bottom-nav" aria-label="Primary">
          <NavLink to="/home" className="app-bottom-nav__item" data-active={pathname.startsWith("/home")}>
            <Home className="size-5" aria-hidden />
            <span>Home</span>
          </NavLink>
          <NavLink to="/create" className="app-bottom-nav__plus" aria-label="Create a post">
            <Plus className="size-6" aria-hidden />
          </NavLink>
          <NavLink to="/inbox" className="app-bottom-nav__item" data-active={pathname.startsWith("/inbox")}>
            <MessageCircle className="size-5" aria-hidden />
            <span>Messages</span>
          </NavLink>
          <NavLink to="/profile" className="app-bottom-nav__item" data-active={pathname.startsWith("/profile")}>
            <User className="size-5" aria-hidden />
            <span>Profile</span>
          </NavLink>
        </nav>
      )}
    </div>
  );
}
