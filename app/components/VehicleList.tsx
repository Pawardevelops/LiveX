"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Bike,
  MapPin,
  Gauge,
  CalendarClock,
  Search,
  Filter,
  ChevronRight,
  Radio,
} from "lucide-react";
import DetailsSection from "./DetailsSection";
import { bikes, tabs } from "./data";
import VehicleCardSection from "./VehicleCardSection";

type VehicleStatus = "Pending" | "In Progress" | "Completed";

export default function VehicleList() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"ALL" | VehicleStatus>("ALL");
  const [sort, setSort] = useState<"recent" | "name" | "odo">("recent");

  const filtered = useMemo(() => {
    let rows = [...bikes];

    if (q.trim()) {
      const needle = q.toLowerCase();
      rows = rows.filter(
        (b) =>
          b.name.toLowerCase().includes(needle) ||
          b.regNo.toLowerCase().includes(needle)
      );
    }

    if (status !== "ALL") {
      rows = rows.filter((b) => b.status === status);
    }

    rows.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "odo") return b.odoKm - a.odoKm;
      const aTime = a.lastInspection ? Date.parse(a.lastInspection) : 0;
      const bTime = b.lastInspection ? Date.parse(b.lastInspection) : 0;
      if (aTime !== bTime) return bTime - aTime;
      return b.year - a.year;
    });

    return rows;
  }, [q, status, sort]);

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.10),transparent_45%),radial-gradient(ellipse_at_bottom_right,rgba(16,185,129,0.10),transparent_45%)] px-4 py-6">
      <div className="mx-auto max-w-7xl">
        {/* Brand + Title */}
        <div className="mb-8">
          <div className="flex items-end justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#000000_80%] via-[#ffffff_80%] to-[#000000_80%]">
                  Po
                </span>
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Advanced Vehicle Inspection Management System
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Stats and Bike Section */}
        <DetailsSection />

        {/* Search and Filter Controls */}
        <Card className="border-white/50 bg-white/80 backdrop-blur mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by name or registration number"
                  className="pl-9"
                />
              </div>

              <div className="flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
                {/* Status filter */}
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-400" />
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setStatus("ALL")}
                      className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                        status === "ALL"
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      All
                    </button>
                    {(
                      ["Pending", "In Progress", "Completed"] as VehicleStatus[]
                    ).map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatus(s)}
                        className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                          status === s
                            ? "bg-gray-900 text-white border-gray-900"
                            : "bg-white text-gray-700 border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Sort:</span>
                  <div className="flex gap-1 bg-white rounded-md border border-gray-200 p-1">
                    {[
                      { key: "recent", label: "Recent" },
                      { key: "name", label: "Name" },
                      { key: "odo", label: "Odo" },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setSort(key as typeof sort)}
                        className={`px-3 py-1 rounded-md text-xs transition-colors ${
                          sort === key
                            ? "bg-gray-900 text-white"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Results Badge */}
        <div className="flex items-center gap-2 mb-6">
          <Badge variant="outline" className="text-xs md:text-sm">
            Total: {filtered.length}/{bikes.length}
          </Badge>
          <p className="text-xs md:text-sm text-gray-600">
            Select a vehicle to view details or start inspection
          </p>
        </div>

        {/* Vehicle Cards Grid */}
        <VehicleCardSection filtered={filtered} />

        {/* Empty State */}
        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 flex flex-col items-center justify-center text-center text-gray-600"
          >
            <Bike className="h-12 w-12 mb-4 text-gray-400" />
            <h3 className="text-lg font-medium mb-2">No vehicles found</h3>
            <p className="text-xs md:text-sm mb-4">
              No vehicles match your current filters. Try adjusting your search
              criteria.
            </p>
            <Button
              variant="secondary"
              onClick={() => {
                setQ("");
                setStatus("ALL");
              }}
              className="hover:scale-105 transition-transform"
            >
              Reset filters
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
