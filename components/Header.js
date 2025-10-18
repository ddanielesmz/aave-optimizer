"use client";

import Link from "next/link";
import Image from "next/image";
import ButtonSignin from "./ButtonSignin";
import logo from "@/app/icon.png";
import config from "@/config";

const cta = <ButtonSignin text="Launch Dashboard" extraStyle="btn-primary" />;

// A simple header with logo and CTA button
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
            title={`${config.appName} hompage`}
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
        
        {/* CTA button for mobile */}
        <div className="flex lg:hidden">
          {cta}
        </div>

        {/* CTA button for desktop */}
        <div className="hidden lg:flex lg:justify-end lg:flex-1">{cta}</div>
      </nav>
    </header>
  );
};

export default Header;
