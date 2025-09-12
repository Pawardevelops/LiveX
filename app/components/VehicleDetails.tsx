"use client";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Bike as BikeIcon,
  MapPin,
  Gauge,
  CalendarClock,
  Camera,
  Video,
  FileText,
  X,
  Settings,
} from "lucide-react";
import VehicleDetailsTabView from "./VehicleDetailsTabView";
import { loadBikesFromStorage } from "./VehicleList";
import AnnotatedImageViewer from "./AnnotatedImageViewer";

type Vehicle = {
  id: number;
  name: string;
  year: number;
  color: string;
  regNo: string;
  odoKm: number;
  location: string;
  status: "Pending" | "In Progress" | "Completed";
  lastInspection?: string;
  thumb?: string;
  details?: string;
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
  const params = useParams();
  const vehicleId = params.id ? params.id : "";
  const loadedBikes = loadBikesFromStorage();
  const bike = loadedBikes.find((b) => b.id === parseInt(bikeId));
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [vehicleSummary, setVehicleSummary] = useState();

  console.log(vehicleSummary, "check now ");

  useEffect(() => {
    // Define an async function inside the effect
    const fetchData = async () => {
      try {
        // 1. Fetch the data and await the response
        const response = await fetch("/api/upload/?vehicleId=1");

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // 2. Parse the initial JSON response
        const data = await response.json();

        // 3. The 'analysis' field is a string, so we need to clean and parse it
        // Remove the markdown code fences (```json and ```)
        const cleanedString = data.analysis.replace(/```json\n|\n```/g, "");

        // Parse the cleaned string to get the actual JSON object
        const parsedAnalysis = JSON.parse(cleanedString);

        // 4. Update the state with the final data
        setVehicleSummary(parsedAnalysis);
      } catch (e) {
        // setError(e.message);
      } finally {
        // setIsLoading(false);
      }
    };

    // Call the async function
    fetchData();
  }, []);

  if (!bike) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="max-w-sm w-full text-center">
            <CardHeader>
              <CardTitle>Vehicle not found</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                The vehicle you're looking for doesn't exist or may have been
                removed.
              </p>
              <Button
                className="w-full"
                onClick={() => router.push("/vehicles")}
              >
                Back to Vehicles
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.10),transparent_45%),radial-gradient(ellipse_at_bottom_right,rgba(16,185,129,0.10),transparent_45%)] px-4 py-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-6xl mb-6 flex items-center justify-between"
      >
        <Button
          variant="ghost"
          onClick={() => router.back()}
          className="flex items-center gap-2 hover:bg-white/50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div className="text-right">
          <div className="text-xs text-gray-600">Vehicle Inspection</div>
          <div className="text-2xl font-extrabold tracking-tight">
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-emerald-600 to-blue-600">
              LiveX
            </span>
          </div>
        </div>
      </motion.div>

      {/* Vehicle Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mx-auto max-w-6xl mb-6"
      >
        <Card className="border-white/60 bg-white/85 backdrop-blur">
          <CardContent className="p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Vehicle Image */}
              <div className="lg:w-1/3">
                <motion.div
                  className="relative w-full h-48 lg:h-64 rounded-lg overflow-hidden bg-gray-100"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  {bike.thumb ? (
                    <img
                      src={`https://livex-po-bucket.s3.ap-south-1.amazonaws.com/${bike.id}/right_photo.png`}
                      alt={`${bike.name} photo`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        e.currentTarget.src =
                          bike.thumb || "/default-image.png";
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <BikeIcon className="h-16 w-16" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4">
                    <Badge
                      variant="outline"
                      className={`border ${
                        statusStyles[bike.status]
                      } backdrop-blur`}
                    >
                      {bike.status}
                    </Badge>
                  </div>
                </motion.div>
              </div>

              {/* Vehicle Info */}
              <div className="lg:w-2/3">
                <div className="mb-4">
                  <h1 className="text-2xl lg:text-3xl font-bold text-gray-900 mb-2">
                    {bike.name}
                  </h1>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { label: "Year", value: bike.year, icon: CalendarClock },
                    { label: "Color", value: bike.color, icon: Settings },
                    {
                      label: "Registration",
                      value: bike.regNo,
                      icon: FileText,
                    },
                    {
                      label: "Odometer",
                      value: `${bike.odoKm.toLocaleString()} km`,
                      icon: Gauge,
                    },
                  ].map((item, index) => (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white rounded-lg p-3 border border-gray-200"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <item.icon className="h-4 w-4 text-gray-400" />
                        <span className="text-xs text-gray-500 uppercase tracking-wide">
                          {item.label}
                        </span>
                      </div>
                      <div className="font-semibold text-gray-900">
                        {item.value}
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    {bike.location}
                  </div>
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4" />
                    Last inspection:{" "}
                    {bike.lastInspection
                      ? new Date(bike.lastInspection).toLocaleDateString()
                      : "—"}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Tab Navigation */}

      {/* Tab Content */}
      <VehicleDetailsTabView bike={bike} />

      <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 border rounded-lg shadow-sm mt-10">
        {vehicleSummary?.defects?.length > 0 ? (
          vehicleSummary.defects.map((d: any, index: any) => (
            <div key={index} className=" bg-white">
              <h3 className="text-lg font-semibold mb-2">
                Defect Identified in{" "}
                {d.Type.replace(/_/g, " ").replace(
                  /^(\w)/,
                  ({ char }: { char: string }) => char
                )}
              </h3>
              <p className="text-gray-700 mb-4">
                {d?.description || "No description available."}
              </p>

              <span className="w-[300px] md:w-full">
                <AnnotatedImageViewer
                  imageUrl={`https://livex-po-bucket.s3.ap-south-1.amazonaws.com/1/${d.Type}.png`}
                  analysisData={{ defects: [d] }}
                />
              </span>
            </div>
          ))
        ) : (
          <p className="text-gray-500">No defects found.</p>
        )}
      </div>

      {/* Media Modal */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedMedia(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold text-lg">{selectedMedia.title}</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedMedia(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="p-4 flex items-center justify-center bg-gray-100 min-h-[300px]">
                {selectedMedia.type === "image" ? (
                  <Camera className="h-16 w-16 text-gray-400" />
                ) : (
                  <div className="flex flex-col items-center">
                    <Video className="h-16 w-16 text-gray-400 mb-4" />
                    <Badge>{selectedMedia.duration}</Badge>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-6 right-6"
      >
        <Button
          size="lg"
          className="rounded-full shadow-lg hover:shadow-xl transition-shadow"
          onClick={() => router.push("/vehicles")}
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back to Vehicles
        </Button>
      </motion.div>
    </div>
  );
}
