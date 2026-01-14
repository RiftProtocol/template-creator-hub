import { useState, useEffect } from "react";
import { NavLink, Link } from "react-router-dom";
import logo from "@/assets/logo.svg";
import { WalletButton } from "@/components/wallet";

export const Header = () => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Prevent body scroll when menu is open
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
  }, [open]);

  // Detect scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      {/* HEADER */}
      <header
        className={`fixed top-0 w-full z-50 transition-all duration-300 ${
          scrolled || open
            ? "bg-background/10 backdrop-blur-xl border-b border-foreground/20"
            : "bg-transparent"
        }`}
      >
        <div className="lg:container mx-auto flex items-center justify-between px-6 py-4">
          {/* Logo */}
          <Link to="/" className="cursor-pointer">
            <img src={logo} alt="Logo" className="h-8" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex gap-8">
            <NavLink
              to="/stats"
              className={({ isActive }) =>
                `transition-colors cursor-pointer ${
                  isActive ? "text-nav-active" : "text-foreground hover:text-nav-active"
                }`
              }
            >
              Statistics
            </NavLink>

            <NavLink
              to="/wallet-connected"
              className={({ isActive }) =>
                `transition-colors cursor-pointer ${
                  isActive ? "text-nav-active" : "text-foreground hover:text-nav-active"
                }`
              }
            >
              Launch App
            </NavLink>
          </nav>

          {/* Right */}
          <div className="flex items-center gap-3">
            <WalletButton />

            {/* Hamburger / Close Toggle */}
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden text-foreground cursor-pointer"
            >
              {open ? (
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M6 6l12 12M6 18L18 6"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                </svg>
              ) : (
                <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M4 6h16M4 12h16M4 18h16"
                    stroke="currentColor"
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE OVERLAY (Below Header) */}
      {open && (
        <div className="fixed top-[72px] left-0 right-0 bottom-0 z-[40] md:hidden bg-background/10 backdrop-blur-[40px]">
          <nav className="flex flex-col items-center justify-center w-full h-full gap-8">
            <NavLink
              to="/stats"
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `text-[24px] font-inter transition-colors ${
                  isActive ? "text-nav-active" : "text-foreground hover:text-nav-active"
                }`
              }
            >
              Statistics
            </NavLink>

            <NavLink
              to="/wallet-connected"
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `text-[24px] font-inter transition-colors ${
                  isActive ? "text-nav-active" : "text-foreground hover:text-nav-active"
                }`
              }
            >
              Launch App
            </NavLink>
          </nav>
        </div>
      )}
    </>
  );
};
