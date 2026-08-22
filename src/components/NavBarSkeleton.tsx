import Link from "next/link";
import { navLinks } from "./navLinks";

function NavBarSkeleton() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link href="/">
          <span className="navbar-logo-icon">▶</span>
          ScreenCrave
        </Link>
      </div>
      <div className="navbar-links">
        {navLinks.map(({ href, label }) => (
          <span key={href} className="nav-link">{label}</span>
        ))}
      </div>
      <div className="navbar-auth" />
    </nav>
  );
}

export default NavBarSkeleton;