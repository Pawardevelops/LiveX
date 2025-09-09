"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Bike, MapPin, Gauge, CalendarClock, Search, Filter, ChevronRight } from "lucide-react";

type VehicleStatus = "Pending" | "In Progress" | "Completed";

type Vehicle = {
  id: number;
  name: string;
  year: number;
  color: string;
  regNo: string;
  odoKm: number;
  location: string;
  status: VehicleStatus;
  lastInspection?: string; // ISO date
  thumb?: string; // optional image url
};

const bikes: Vehicle[] = [
  {
    id: 1,
    name: "Royal Enfield Classic 350",
    year: 2022,
    color: "Black",
    regNo: "MH12 AB 3456",
    odoKm: 12850,
    location: "Pune Yard A",
    status: "Pending",
    lastInspection: "2025-08-30",
    thumb: "/images/bikes/classic350.jpg",
  },
  {
    id: 2,
    name: "Bajaj Pulsar NS200",
    year: 2023,
    color: "Red",
    regNo: "DL3C XY 9087",
    odoKm: 5400,
    location: "Delhi Lot 3",
    status: "In Progress",
    lastInspection: "2025-09-02",
    thumb: "/images/bikes/ns200.jpg",
  },
  {
    id: 3,
    name: "TVS Apache RTR 160",
    year: 2021,
    color: "Blue",
    regNo: "KA05 MN 2211",
    odoKm: 20350,
    location: "Bengaluru Zone 1",
    status: "Completed",
    lastInspection: "2025-08-25",
    thumb: "/images/bikes/apache160.jpg",
  },
];

const statusStyles: Record<VehicleStatus, string> = {
  Pending: "bg-amber-100 text-amber-800 border-amber-200",
  "In Progress": "bg-blue-100 text-blue-800 border-blue-200",
  Completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

export default function VehicleList() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"ALL" | VehicleStatus>("ALL");
  const [sort, setSort] = useState<"recent" | "name" | "odo">("recent");

  const filtered = useMemo(() => {
    let rows = [...bikes];

    // Filter by search text (name/reg no)
    if (q.trim()) {
      const needle = q.toLowerCase();
      rows = rows.filter(
        (b) =>
          b.name.toLowerCase().includes(needle) ||
          b.regNo.toLowerCase().includes(needle)
      );
    }

    // Filter by status
    if (status !== "ALL") {
      rows = rows.filter((b) => b.status === status);
    }

    // Sort
    rows.sort((a, b) => {
      if (sort === "name") return a.name.localeCompare(b.name);
      if (sort === "odo") return b.odoKm - a.odoKm;
      // recent by lastInspection desc (fallback to newest year)
      const aTime = a.lastInspection ? Date.parse(a.lastInspection) : 0;
      const bTime = b.lastInspection ? Date.parse(b.lastInspection) : 0;
      if (aTime !== bTime) return bTime - aTime;
      return b.year - a.year;
    });

    return rows;
  }, [q, status, sort]);

  const handleBikeClick = (id: number) => {
    router.push(`/vehicles/${id}`);
  };

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.10),transparent_45%),radial-gradient(ellipse_at_bottom_right,rgba(16,185,129,0.10),transparent_45%)] px-4 py-6">
      {/* Brand + Title */}
      <div className="mx-auto max-w-5xl mb-4">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-emerald-600 to-blue-600">
                LiveX
              </span>
            </h1>
            <p className="text-sm text-gray-600 mt-1">Select a vehicle to view or start inspection</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="hidden sm:inline-flex">
              Total: {filtered.length}/{bikes.length}
            </Badge>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mx-auto max-w-5xl">
        <Card className="border-white/50 bg-white/80 backdrop-blur">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search by name or registration number"
                  className="pl-9"
                />
              </div>

              {/* Status filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-400 hidden sm:block" />
                <div className="flex gap-2">
                  <button
                    onClick={() => setStatus("ALL")}
                    className={`px-3 py-1 rounded-full text-xs border ${
                      status === "ALL"
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-700 border-gray-200"
                    }`}
                  >
                    All
                  </button>
                  {(["Pending", "In Progress", "Completed"] as VehicleStatus[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={`px-3 py-1 rounded-full text-xs border ${
                        status === s
                          ? "bg-gray-900 text-white border-gray-900"
                          : "bg-white text-gray-700 border-gray-200"
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
                  <button
                    onClick={() => setSort("recent")}
                    className={`px-3 py-1 rounded-md text-xs ${
                      sort === "recent" ? "bg-gray-900 text-white" : "text-gray-700"
                    }`}
                  >
                    Recent
                  </button>
                  <button
                    onClick={() => setSort("name")}
                    className={`px-3 py-1 rounded-md text-xs ${
                      sort === "name" ? "bg-gray-900 text-white" : "text-gray-700"
                    }`}
                  >
                    Name
                  </button>
                  <button
                    onClick={() => setSort("odo")}
                    className={`px-3 py-1 rounded-md text-xs ${
                      sort === "odo" ? "bg-gray-900 text-white" : "text-gray-700"
                    }`}
                  >
                    Odo
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* List/Grid */}
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((bike) => (
            <Card
              key={bike.id}
              role="button"
              tabIndex={0}
              onClick={() => handleBikeClick(bike.id)}
              onKeyDown={(e) => e.key === "Enter" && handleBikeClick(bike.id)}
              className="group overflow-hidden border-white/60 bg-white/90 backdrop-blur hover:shadow-lg transition-shadow cursor-pointer"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-lg font-semibold leading-tight">
                    {bike.name}
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className={`border ${statusStyles[bike.status]}`}
                  >
                    {bike.status}
                  </Badge>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {bike.year} • {bike.color} • {bike.regNo}
                </div>
              </CardHeader>

              {/* Thumbnail / icon */}
              <CardContent className="pt-0">
                <div className="relative w-full h-36 rounded-lg overflow-hidden bg-gray-100">
                  {bike.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={bike.thumb}
                      alt={`${bike.name} photo`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-gray-400">
                      <Bike className="h-10 w-10" />
                    </div>
                  )}
                </div>

                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-gray-700">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{bike.location}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <Gauge className="h-4 w-4 text-gray-400" />
                    <span>Odometer: <strong>{bike.odoKm.toLocaleString()} km</strong></span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-700">
                    <CalendarClock className="h-4 w-4 text-gray-400" />
                    <span>
                      Last inspection:{" "}
                      <strong>
                        {bike.lastInspection
                          ? new Date(bike.lastInspection).toLocaleDateString()
                          : "—"}
                      </strong>
                    </span>
                  </div>
                </div>
              </CardContent>

              <Separator className="mt-2" />

              <CardFooter className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  Tap to open details
                </div>
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBikeClick(bike.id);
                  }}
                  className="group/btn"
                >
                  View
                  <ChevronRight className="ml-1 h-4 w-4 transition-transform group-hover/btn:translate-x-0.5" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="mt-10 flex flex-col items-center justify-center text-center text-gray-600">
            <Bike className="h-10 w-10 mb-2 text-gray-400" />
            <p className="font-medium">No vehicles match your filters.</p>
            <p className="text-sm">Try clearing the search or picking a different status.</p>
            <Button variant="secondary" className="mt-3" onClick={() => { setQ(""); setStatus("ALL"); }}>
              Reset filters
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
