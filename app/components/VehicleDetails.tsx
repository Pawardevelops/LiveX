"use client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Radio,
  Bike as BikeIcon,
  MapPin,
  Gauge,
  CalendarClock,
} from "lucide-react";

/* --- Demo data (richer fields) --- */
type Vehicle = {
  id: number;
  name: string;
  details: string; // kept from your original
  year: number;
  color: string;
  regNo: string;
  odoKm: number;
  location: string;
  status: "Pending" | "In Progress" | "Completed";
  lastInspection?: string;
  thumb?: string;
};

const bikes: Vehicle[] = [
  {
    id: 1,
    name: "Royal Enfield Classic 350",
    details: "2022 Model, Black",
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
    details: "2023 Model, Red",
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
    details: "2021 Model, Blue",
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

const statusStyles: Record<Vehicle["status"], string> = {
  Pending: "bg-amber-100 text-amber-800 border-amber-200",
  "In Progress": "bg-blue-100 text-blue-800 border-blue-200",
  Completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
};

export default function VehicleDetails({ bikeId }: { bikeId: string }) {
  const router = useRouter();
  const bike = bikes.find((b) => b.id === parseInt(bikeId));

  const handleStartLive = () => router.push("/live");

  if (!bike) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center px-4">
        <Card className="max-w-sm w-full text-center">
          <CardHeader>
            <CardTitle>Vehicle not found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              The vehicle you’re looking for doesn’t exist or may have been removed.
            </p>
            <Button className="mt-4 w-full" onClick={() => router.push("/vehicles")}>
              Back to Vehicles
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.10),transparent_45%),radial-gradient(ellipse_at_bottom_right,rgba(16,185,129,0.10),transparent_45%)] px-4 py-6">
      {/* Header / Brand */}
      <div className="mx-auto max-w-4xl mb-4 flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
          aria-label="Go back"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <div className="text-right">
          <div className="text-xs text-gray-600">App</div>
          <div className="text-2xl font-extrabold tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-emerald-600 to-blue-600">
              LiveX
            </span>
          </div>
        </div>
      </div>

      {/* Main Card */}
      <div className="mx-auto max-w-4xl">
        <Card className="border-white/60 bg-white/85 backdrop-blur">
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle className="text-xl sm:text-2xl leading-tight">
                  {bike.name}
                </CardTitle>
                <p className="text-sm text-gray-600 mt-1">{bike.details}</p>
              </div>
              <Badge variant="outline" className={`border ${statusStyles[bike.status]}`}>
                {bike.status}
              </Badge>
            </div>
          </CardHeader>

          <CardContent>
            {/* Media + Specs */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-5">
              {/* Media */}
              <div className="sm:col-span-2">
                <div className="relative w-full h-44 sm:h-56 rounded-lg overflow-hidden bg-gray-100">
                  {bike.thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={bike.thumb}
                      alt={`${bike.name} photo`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <BikeIcon className="h-10 w-10" />
                    </div>
                  )}
                </div>
              </div>

              {/* Specs */}
              <div className="sm:col-span-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-md border bg-white px-3 py-2">
                    <div className="text-[11px] uppercase tracking-wide text-gray-500">Year</div>
                    <div className="font-medium">{bike.year}</div>
                  </div>
                  <div className="rounded-md border bg-white px-3 py-2">
                    <div className="text-[11px] uppercase tracking-wide text-gray-500">Color</div>
                    <div className="font-medium">{bike.color}</div>
                  </div>
                  <div className="rounded-md border bg-white px-3 py-2">
                    <div className="text-[11px] uppercase tracking-wide text-gray-500">Registration</div>
                    <div className="font-medium">{bike.regNo}</div>
                  </div>
                  <div className="rounded-md border bg-white px-3 py-2">
                    <div className="text-[11px] uppercase tracking-wide text-gray-500">Odometer</div>
                    <div className="font-medium">{bike.odoKm.toLocaleString()} km</div>
                  </div>
                  <div className="rounded-md border bg-white px-3 py-2 col-span-2">
                    <div className="text-[11px] uppercase tracking-wide text-gray-500">Location</div>
                    <div className="font-medium flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      {bike.location}
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-gray-700">
                  <div className="inline-flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-gray-400" />
                    Last inspection:
                    <span className="font-semibold">
                      {bike.lastInspection
                        ? new Date(bike.lastInspection).toLocaleDateString()
                        : "—"}
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <Gauge className="h-4 w-4 text-gray-400" />
                    Health: <span className="font-semibold">—</span>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-5" />

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button className="h-11 text-base" onClick={handleStartLive}>
                <Radio className="mr-2 h-4 w-4" />
                Start Live
              </Button>
              <Button
                variant="secondary"
                className="h-11 text-base"
                onClick={() => router.push("/vehicles")}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Vehicles
              </Button>
            </div>

            {/* Small note */}
            <p className="mt-3 text-xs text-gray-500">
              Tip: Ensure camera and microphone permissions are enabled before starting Live.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
