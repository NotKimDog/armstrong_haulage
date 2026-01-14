"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getDatabase, ref as dbRef, child as dbChild, get as dbGet } from "firebase/database";
import { app } from "../app/api/lib/firebase";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Search as SearchIcon } from "lucide-react";

type SearchResult = {
  id: string;
  displayName: string;
  photoURL?: string;
  slug?: string;
  bio?: string;
  type: 'profile';
};

export default function SearchPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams?.get("q") || "";
  
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchInput, setSearchInput] = useState(query);

  const performSearch = useCallback(async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const database = getDatabase(app);
      const snap = await dbGet(dbChild(dbRef(database), "users"));
      const arr: SearchResult[] = [];

      if (snap.exists()) {
        const usersObj = snap.val() as Record<string, any>;
        const qlower = query.toLowerCase();

        Object.entries(usersObj).forEach(([id, u]) => {
          const displayName = String((u && (u.displayName || "")) || "");
          const slug = String((u && (u.slug || "")) || "");
          const photoURL = (u && u.photoURL) || undefined;
          const bio = (u && u.bio) || undefined;

            if (
              displayName.toLowerCase().includes(qlower) ||
              slug.toLowerCase().includes(qlower)
            ) {
              arr.push({
                id,
                displayName,
                photoURL,
                slug: slug || undefined,
                bio,
                type: "profile",
              });
            }
          });
        
        // Limit to 10 results
        arr.splice(10);
        }

        setResults(arr);
      } catch (error) {
        console.error("Search failed:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, [query]);

    useEffect(() => {
      performSearch();
    }, [performSearch]);

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (searchInput.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchInput.trim())}`);
    }
  }, [searchInput, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-950 via-black to-neutral-950 pt-32 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Search Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Search Results
          </h1>
          <p className="text-gray-400 text-lg mb-8">
            {query && `Results for "${query}"`}
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex gap-3 mb-8">
            <div className="relative flex-1">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search profiles..."
                className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:bg-white/10 transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
            >
              Search
            </button>
          </form>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
            <span className="ml-3 text-gray-400">Searching...</span>
          </div>
        )}

        {/* Results */}
        {!loading && results.length > 0 && (
          <div>
            {/* Profiles Section */}
            {results.length > 0 && (
              <div className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <h2 className="text-2xl font-bold text-white">Profiles</h2>
                  <span className="text-sm font-semibold text-gray-400 bg-white/5 px-3 py-1 rounded-full">
                    {results.length}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {results.map((result) => (
                    <Link
                      key={result.id}
                      href={`/profile/${encodeURIComponent(result.slug || result.id)}`}
                    >
                      <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 hover:border-purple-500/50 transition-all duration-300 cursor-pointer h-full flex flex-col group">
                        {/* Avatar */}
                        <div className="flex justify-center mb-4">
                          {result.photoURL ? (
                            <Image
                              src={result.photoURL}
                              alt={result.displayName}
                              width={80}
                              height={80}
                              className="w-20 h-20 rounded-full border-2 border-purple-500 group-hover:border-purple-400 transition-colors"
                            />
                          ) : (
                            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center text-white text-2xl font-bold group-hover:from-purple-500 group-hover:to-purple-700 transition-colors">
                              {result.displayName[0].toUpperCase()}
                            </div>
                          )}
                        </div>

                        {/* Name */}
                        <h3 className="text-lg font-bold text-white text-center mb-1 truncate group-hover:text-purple-400 transition-colors">
                          {result.displayName}
                        </h3>

                        {/* Slug */}
                        {result.slug && (
                          <p className="text-sm text-purple-400 text-center mb-3 font-medium">
                            @{result.slug}
                          </p>
                        )}

                        {/* Type Badge */}
                        <div className="flex justify-center mb-3">
                          <span className="text-xs font-semibold text-green-400 bg-green-400/10 px-3 py-1 rounded-full">
                            PROFILE
                          </span>
                        </div>

                        {/* Bio */}
                        {result.bio && (
                          <p className="text-sm text-gray-300 text-center line-clamp-3 mb-4 flex-1">
                            {result.bio}
                          </p>
                        )}

                        {/* View Profile Button */}
                        <button className="mt-auto w-full py-2.5 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white text-sm font-semibold rounded-lg transition-all duration-300 transform group-hover:scale-105">
                          View Profile
                        </button>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* No Results */}
        {!loading && results.length === 0 && query && (
          <div className="text-center py-12">
            <SearchIcon className="w-12 h-12 text-gray-400 mx-auto mb-4 opacity-50" />
            <p className="text-gray-400 text-lg">
              No profiles found for "{query}"
            </p>
            <p className="text-gray-500 text-sm mt-2">
              Try a different search term
            </p>
          </div>
        )}

        {/* No Query */}
        {!query && (
          <div className="text-center py-12">
            <SearchIcon className="w-12 h-12 text-gray-400 mx-auto mb-4 opacity-50" />
            <p className="text-gray-400 text-lg">
              Enter a search term above
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
