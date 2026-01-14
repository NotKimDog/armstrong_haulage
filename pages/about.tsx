import Image from "next/image";
import { Truck, MapPin, Calendar, Award } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="flex flex-col min-h-screen bg-neutral-950 pt-32">
      <main className="grow">
        {/* Hero Section */}
        <div className="relative h-[50vh] flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute inset-0 bg-black/60 z-10" />
            <Image
              src="/banner.png"
              alt="About Us Banner"
              fill
              className="object-cover"
              priority
            />
          </div>
          <div className="relative z-20 text-center px-4">
            <h1 className="text-5xl md:text-7xl font-black text-white mb-4 tracking-tighter">
              ABOUT <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-purple-600">US</span>
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Driving the future of virtual trucking with passion and professionalism.
            </p>
          </div>
        </div>
        

        {/* Content Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 space-y-24">
          
          {/* Mission & Story */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-white">Our Mission</h2>
              <p className="text-gray-400 leading-relaxed text-lg">
                Armstrong Haulage was founded with a simple mission: to create a community where virtual truckers can come together, share their passion, and drive with purpose. What started as a small group of friends has grown into a thriving VTC with drivers from all over the world.
              </p>
              <p className="text-gray-400 leading-relaxed text-lg">
                We pride ourselves on maintaining a professional yet fun environment. Whether you&apos;re a casual driver or a hardcore simulation enthusiast, there&apos;s a place for you here.
              </p>
            </div>
            <div className="relative h-80 rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-neutral-900 group">
               <div className="absolute inset-0 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                  <Image
                    src="/logo.jpg"
                    alt="Armstrong Haulage Logo"
                    width={256}
                    height={256}
                    className="object-contain w-64 h-64"
                  />
               </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}