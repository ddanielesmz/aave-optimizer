"use client";

import Link from "next/link";
import Image from "next/image";
import logo from "@/app/icon.png";
import config from "@/config";

// A simple header with logo and direct dashboard link
const Header = () => {
  return (
    <header className="bg-base-200">
      <nav
        className="container flex items-center justify-between px-8 py-4 mx-auto"
        aria-label="Global"
      >
        {/* Logo and brand name */}
        <div className="flex lg:flex-1">
          <Link
            className="flex items-center gap-2 shrink-0 "
            href="/"
            title={`${config.appName} homepage`}
          >
            <Image
              src={logo}
              alt={`${config.appName} logo`}
              className="w-8"
              placeholder="blur"
              priority={true}
              width={32}
              height={32}
            />
            <span className="font-extrabold text-lg">{config.appName}</span>
          </Link>
        </div>
        
        {/* Direct dashboard link for mobile */}
        <div className="flex lg:hidden">
          <Link href="/dashboard" className="btn btn-primary">
            Launch Dashboard
          </Link>
        </div>

        {/* Direct dashboard link for desktop */}
        <div className="hidden lg:flex lg:justify-end lg:flex-1">
          <Link href="/dashboard" className="btn btn-primary">
            Launch Dashboard
          </Link>
        </div>
      </nav>
    </header>
  );
};

export default Header;
