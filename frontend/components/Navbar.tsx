'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useSession } from '@/lib/auth';
import { User, Menu, Settings, LogOut, X, Sparkles, LayoutDashboard } from 'lucide-react';
import { useState, useEffect } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';

export default function Navbar() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const prefersReducedMotion = useReducedMotion();

  // Track scroll position for navbar effects
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  const navVariants: Variants = {
    hidden: { y: -100, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.6,
        ease: [0.22, 1, 0.36, 1] as const
      },
    },
  };

  const navContainerClasses = cn(
    "fixed z-50 left-1/2 -translate-x-1/2 transition-all duration-300 md:max-w-7xl w-full",
    scrolled ? "top-4 px-4" : "top-0 px-0"
  );

  const navInnerClasses = cn(
    "relative flex items-center justify-between px-6 transition-all duration-500",
    scrolled
      ? "py-3 bg-background/60 backdrop-blur-xl border border-white/10 shadow-2xl rounded-2xl md:rounded-full"
      : "py-4 bg-transparent border-b border-transparent md:border-b-white/5"
  );

  return (
    <>
      <motion.nav
        className={navContainerClasses}
        variants={navVariants}
        initial="hidden"
        animate="visible"
      >
        <div className={navInnerClasses}>
          {/* Logo */}
          <motion.div
            className="flex items-center gap-2"
            whileHover={prefersReducedMotion ? {} : { scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <div className={cn(
              "relative flex items-center justify-center p-2 rounded-xl transition-all duration-300 overflow-hidden group",
              scrolled ? "bg-primary/10" : "bg-transparent"
            )}>
              <div className="absolute inset-0 bg-linear-to-br from-primary to-emerald-400 opacity-20 group-hover:opacity-100 transition-opacity duration-300" />
              <Sparkles className={cn(
                "w-5 h-5 transition-colors relative z-10",
                scrolled ? "text-primary group-hover:text-primary-foreground" : "text-primary"
              )} />
            </div>
            <Link href="/" className="font-bold text-xl tracking-tight">
              Todo<span className="text-primary">App</span>
            </Link>
          </motion.div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <nav className="flex items-center gap-1">
              <NavLink href="//">Home</NavLink>
              <NavLink href="/#features">Features</NavLink>
              <NavLink href="/#pricing">Pricing</NavLink>
              <NavLink href="/contact">Contact</NavLink>
            </nav>

            <div className="h-4 w-px bg-border mx-2" />

            <div className="flex items-center gap-3">
              <ThemeToggle />

              {!session?.user ? (
                <>
                  <Link href="/login">
                    <Button variant="ghost" className="hover:bg-primary/5 rounded-full px-6">Login</Button>
                  </Link>
                  <Link href="/signup">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button className="rounded-full px-6 shadow-lg shadow-primary/20 bg-linear-to-r from-primary to-emerald-500 hover:from-primary/90 hover:to-emerald-500/90 text-primary-foreground border-0">
                        Get Started
                      </Button>
                    </motion.div>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/dashboard">
                    <Button variant="ghost" className="hover:bg-primary/5 rounded-full flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Button>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="group relative flex items-center gap-2 pl-2 pr-4 h-11 rounded-full bg-white/5 border border-white/10 hover:border-primary/40 hover:bg-white/10 transition-all duration-300 shadow-lg shadow-black/5"
                      >
                        <div className="relative">
                          <div className="w-7 h-7 rounded-full bg-linear-to-br from-primary via-emerald-400 to-emerald-600 flex items-center justify-center text-[10px] font-black text-[#161616] shadow-inner relative z-10">
                            {session.user.name?.[0].toUpperCase() || 'U'}
                          </div>
                          <div className="absolute inset-0 bg-primary/40 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        </div>
                        <div className="flex flex-col items-start leading-tight">
                          <span className="text-sm font-bold tracking-tight">{session.user.name?.split(' ')[0] || 'User'}</span>
                        </div>
                      </motion.button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-72 p-2 rounded-3xl border border-white/10 bg-background/80 backdrop-blur-2xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] animate-in fade-in zoom-in-95 duration-200"
                      sideOffset={12}
                    >
                      {/* User Header */}
                      <div className="px-4 py-4 mb-2 rounded-2xl bg-primary/5 border border-primary/10">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-linear-to-br from-primary to-emerald-400 flex items-center justify-center text-xl font-black text-[#161616]">
                            {session.user.name?.[0].toUpperCase() || 'U'}
                          </div>
                          <div className="overflow-hidden">
                            <h4 className="font-bold text-base truncate">{session.user.name}</h4>
                            <p className="text-xs text-muted-foreground truncate">{session.user.email}</p>
                          </div>
                        </div>
                      </div>

                      <div className="px-2 py-1.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-50 mb-1">Account</div>
                      <Link href="/dashboard" className="block outline-none">
                        <DropdownMenuItem className="cursor-pointer h-12 rounded-xl focus:bg-primary/10 focus:text-primary transition-colors group/item mb-1">
                          <div className="w-8 h-8 rounded-lg bg-blue-500/5 flex items-center justify-center mr-3 group-hover/item:bg-blue-500/20 transition-colors">
                            <User className="h-4 w-4 text-blue-500" />
                          </div>
                          <span className="font-bold">Profile</span>
                        </DropdownMenuItem>
                      </Link>

                      <Link href="/dashboard/chat" className="block outline-none">
                        <DropdownMenuItem className="cursor-pointer h-12 rounded-xl focus:bg-primary/10 focus:text-primary transition-colors group/item mb-1">
                          <div className="w-8 h-8 rounded-lg bg-indigo-500/5 flex items-center justify-center mr-3 group-hover/item:bg-indigo-500/20 transition-colors">
                            <Sparkles className="h-4 w-4 text-indigo-500" />
                          </div>
                          <span className="font-bold">Chat</span>
                        </DropdownMenuItem>
                      </Link>

                      <Link href="/settings" className="block outline-none">
                        <DropdownMenuItem className="cursor-pointer h-12 rounded-xl focus:bg-primary/10 focus:text-primary transition-colors group/item mb-1">
                          <div className="w-8 h-8 rounded-lg bg-emerald-500/5 flex items-center justify-center mr-3 group-hover/item:bg-emerald-500/20 transition-colors">
                            <Settings className="h-4 w-4 text-emerald-500" />
                          </div>
                          <span className="font-bold">Settings</span>
                        </DropdownMenuItem>
                      </Link>

                      <div className="h-px bg-white/5 my-2 mx-2" />

                      <DropdownMenuItem
                        className="cursor-pointer h-12 rounded-xl text-red-500 focus:text-white focus:bg-red-500 transition-all duration-300 group/logout"
                        onClick={() => {
                          localStorage.removeItem('auth-token');
                          window.location.href = '/login';
                        }}
                      >
                        <div className="w-8 h-8 rounded-lg bg-red-500/5 flex items-center justify-center mr-3 group-hover/logout:bg-white/20 transition-colors">
                          <LogOut className="h-4 w-4" />
                        </div>
                        <span className="font-bold">Logout</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center gap-4">
            <ThemeToggle />
            <motion.button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-full hover:bg-primary/10 transition-colors z-50 relative"
              whileTap={{ scale: 0.9 }}
            >
              <AnimatePresence mode="wait">
                {mobileMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="h-6 w-6" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="h-6 w-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-background/95 backdrop-blur-2xl md:hidden pt-24 px-6"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            <div className="flex flex-col space-y-4">
              <MobileNavLink href="/" onClick={() => setMobileMenuOpen(false)}>Home</MobileNavLink>
              <MobileNavLink href="/#features" onClick={() => setMobileMenuOpen(false)}>Features</MobileNavLink>
              <MobileNavLink href="/#pricing" onClick={() => setMobileMenuOpen(false)}>Pricing</MobileNavLink>
              <MobileNavLink href="/contact" onClick={() => setMobileMenuOpen(false)}>Contact</MobileNavLink>

              <div className="h-px bg-border my-4" />

              {!session?.user ? (
                <>
                  <Link href="/login" className="block" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start text-lg rounded-xl h-12">Login</Button>
                  </Link>
                  <Link href="/signup" className="block" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full text-lg rounded-xl h-12 bg-primary text-primary-foreground">Register</Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/dashboard" className="block" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start text-lg rounded-xl h-12">Dashboard</Button>
                  </Link>
                  <Link href="/dashboard/chat" className="block" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start text-lg rounded-xl h-12">Chat</Button>
                  </Link>
                  <Link href="/settings" className="block" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="ghost" className="w-full justify-start text-lg rounded-xl h-12">Settings</Button>
                  </Link>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-lg rounded-xl h-12 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => {
                      localStorage.removeItem('auth-token');
                      window.location.href = '/login';
                    }}
                  >
                    Logout
                  </Button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="relative px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors group">
      {children}
      <span className="absolute inset-x-0 -bottom-1 h-0.5 bg-primary scale-x-0 group-hover:scale-x-100 transition-transform origin-left rounded-full" />
    </Link>
  );
}

function MobileNavLink({ href, onClick, children }: { href: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block text-2xl font-bold py-2 hover:text-primary transition-colors"
    >
      {children}
    </Link>
  );
}