"use client";
import React from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Radio,
  Bike as BikeIcon,
  MapPin,
  Gauge,
  CalendarClock,
  Bike,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

type VehicleStatus = "Pending" | "In Progress" | "Completed";

const VehicleCardSection = ({ filtered }: { filtered: any }) => {
  const router = useRouter();
  const handleStartLive = (id: any) => router.push(`/live?vehicleId=${id}`);
  const handleBikeClick = (id: number) => {
    router.push(`/vehicles/${id}`);
  };

  const statusStyles: Record<VehicleStatus, string> = {
    Pending: "bg-amber-100 text-amber-800 border-amber-200",
    "In Progress": "bg-blue-100 text-blue-800 border-blue-200",
    Completed: "bg-emerald-100 text-emerald-800 border-emerald-200",
  };

  const hoverStyles: Record<VehicleStatus, string> = {
    Pending: "hover:shadow-yellow-400/50",
    "In Progress": "hover:shadow-blue-400/50",
    Completed: "hover:shadow-green-400/50",
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {filtered.map((bike: any) => (
        <motion.div
          key={bike.id}
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.98 }}
          transition={{ duration: 0.2 }}
        >
          <Card
            role="button"
            tabIndex={0}
            onClick={() => handleBikeClick(bike.id)}
            onKeyDown={(e) => e.key === "Enter" && handleBikeClick(bike.id)}
            className={`group overflow-hidden border-white/60 bg-white/90 backdrop-blur transition-all duration-300 cursor-pointer hover:shadow-xl ${
              hoverStyles[bike.status as VehicleStatus]
            }`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-3">
                <CardTitle className="text-lg font-semibold leading-tight group-hover:text-blue-600 transition-colors">
                  {bike.name}
                </CardTitle>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {bike.year} • {bike.color} • {bike.regNo}
              </div>
            </CardHeader>

            <CardContent className="pt-0">
              <div className="relative w-full h-36 rounded-lg overflow-hidden bg-gray-100">
                {bike.thumb ? (
                  <img
                    src={`https://livex-po-bucket.s3.ap-south-1.amazonaws.com/${bike.id}/right_photo.png`}
                    alt={`${bike.name} photo`}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={(e) => {
                      e.currentTarget.src = bike.thumb || "/default-image.png";
                    }}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-gray-400 group-hover:text-gray-600 transition-colors">
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
                  <span>
                    Odometer: <strong>{bike.odoKm.toLocaleString()} km</strong>
                  </span>
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
                Tap on card to Explore
              </div>

              <Button
                className="h-7 text-xs mt-3 p-4 rounded-full border border-gray-200 hover:border-gray-300"
                onClick={(e) => {
                  e.stopPropagation();
                  handleStartLive(bike.id);
                }}
              >
                <Radio className="mr-2 h-4 w-4" />
                Start live inspection
              </Button>
            </CardFooter>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default VehicleCardSection;
