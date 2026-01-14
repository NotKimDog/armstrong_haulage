"use client";

import Link from "next/link";
import Image from "next/image";
import { Twitch, Youtube, UserRound, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function Footer() {
  return (
    <footer className="bg-neutral-950 border-t border-white/10 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.jpg"
                alt="Armstrong Haulage Logo"
                width={48}
                height={48}
                className="rounded-xl"
              />
              <span className="text-2xl font-bold tracking-wider uppercase text-white">Armstrong Haulage</span>
            </div>
            <p className="text-gray-400 max-w-sm leading-relaxed">
              Professional Virtual Trucking. Delivering excellence across Europe and America with a community that cares.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">Quick Links</h3>
            <ul className="space-y-3">
              <FooterLink href="/">Home</FooterLink>
              <FooterLink href="/about">About Us</FooterLink>
              <FooterLink href="/gallery">Gallery</FooterLink>
              <FooterLink href="/search">Search Members</FooterLink>
              <FooterLink href="https://hub.truckyapp.com/company/40764" target="_blank">Apply Now</FooterLink>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">Community</h3>
            <ul className="space-y-3">
              <FooterLink href="/leaderboard">Leaderboard</FooterLink>
              <FooterLink href="/activity">Activity Feed</FooterLink>
              <FooterLink href="/achievements">Achievements</FooterLink>
              <FooterLink href="/analytics">Analytics</FooterLink>
              <FooterLink href="/profile">My Profile</FooterLink>
            </ul>
          </div>

          {/* Connect */}
          <div>
            <h3 className="text-white font-bold text-lg mb-6">Connect With Us</h3>
            <div className="flex gap-4 mb-6">
              <SocialLink href="https://discord.gg/95MeYjFPre" hoverColor="#5865F2">
                <Image src='/discord.svg' alt='Discord Logo' width={20} height={20}/>
              </SocialLink>
              <SocialLink href="https://www.twitch.tv/armstrong_gaming69" hoverColor="#9146FF">
                <Twitch className="w-5 h-5" />
              </SocialLink>
              <SocialLink href="https://www.youtube.com/@MarkArmstrongGaming" hoverColor="#FF0000">
                <Youtube className="w-5 h-5" />
              </SocialLink>
            </div>
            <div className="space-y-2 text-gray-400">
              <p className="flex items-center gap-2">
                <UserRound className="w-4 h-4 text-purple-500" />
                <span>Made by <a href="https://linktr.ee/KimDog9" target="_blank" className="hover:text-purple-500 transition-colors">KimDog</a></span>
              </p>
            </div>
          </div>
        </div>
        
        <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm font-medium">© {new Date().getFullYear()} Armstrong Haulage. All rights reserved.</p>
          <p className="text-gray-600 text-sm">Virtual Trucking at its finest.</p>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ href, children, target }: { href: string; children: React.ReactNode; target?: string }) {
  return (
    <li>
      <Link href={href} target={target} className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 font-medium group w-fit">
        <ArrowRight className="w-4 h-4 text-purple-500/50 group-hover:text-purple-500 group-hover:translate-x-1 transition-all" />
        <span className="relative">
          {children}
          <span className="absolute left-0 -bottom-0.5 w-0 h-0.5 bg-purple-500 transition-all duration-300 group-hover:w-full" />
        </span>
      </Link>
    </li>
  );
}

function SocialLink({ href, children, hoverColor }: { href: string; children: React.ReactNode; hoverColor: string }) {
  return (
    <motion.a
      href={href}
      target="_blank"
      whileHover={{ scale: 1.1, backgroundColor: hoverColor, color: "#ffffff" }}
      whileTap={{ scale: 0.95 }}
      className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 transition-colors"
    >
      {children}
    </motion.a>
  );
}