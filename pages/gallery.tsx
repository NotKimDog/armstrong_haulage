"use client";

import Link from "next/link";
import { Construction, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function Gallery() {
return (
  <main className="grow flex items-center justify-center relative overflow-hidden px-4 min-h-screen bg-neutral-950 pt-32">
    {/* Background gradient */}
    <div className="absolute inset-0 bg-linear-to-b from-purple-900/20 via-neutral-950/80 to-neutral-950 pointer-events-none z-0" />

    {/* Grid Background */}
    <motion.div
    initial={{ backgroundPosition: "0px 0px" }}
    animate={{ backgroundPosition: "24px 24px" }}
    transition={{
      duration: 20,
      repeat: Infinity,
      ease: "linear",
    }}
    className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px] pointer-events-none z-0"
    />

    <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5 }}
    className="relative z-10 text-center max-w-lg mx-auto"
    >
    <motion.div
      whileHover={{ rotate: 15, scale: 1.1 }}
      className="inline-flex items-center justify-center p-5 rounded-2xl bg-white/5 border border-white/10 mb-8 backdrop-blur-md shadow-2xl shadow-purple-500/10"
    >
      <Construction className="w-10 h-10 text-purple-500" />
    </motion.div>

    <h1 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight">
      Work in{" "}
      <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-purple-600">
      Progress
      </span>
    </h1>

    <p className="text-lg text-gray-400 leading-relaxed mb-8">
      We are currently curating the finest moments from our journeys
      across Europe and America. This feature will be available soon.
    </p>

    <Link href="/">
      <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-bold transition-colors border border-white/10 backdrop-blur-sm"
      >
      <ArrowLeft className="w-4 h-4" /> Back to Home
      </motion.div>
    </Link>
    </motion.div>
  </main>
);
}
