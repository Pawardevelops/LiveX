"use client";
import { useMemo, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Bike, Search, Filter, Plus, X } from "lucide-react";
import DetailsSection from "./DetailsSection";
import VehicleCardSection from "./VehicleCardSection";

type VehicleStatus = "Pending" | "In Progress" | "Completed";

interface Vehicle {
  id: number;
  name: string;
  year: number;
  color: string;
  regNo: string;
  odoKm: number;
  location: string;
  status: VehicleStatus;
  lastInspection: string;
  thumb: string;
}

// Default bikes data - will be used if localStorage is empty
const defaultBikes: Vehicle[] = [];

// localStorage utility functions
const STORAGE_KEY = "vehicles_data";

export const loadBikesFromStorage = (): Vehicle[] => {
  if (typeof window === "undefined") return defaultBikes; // SSR safety

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Validate that parsed data has the expected structure
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (error) {
    console.error("Error loading bikes from localStorage:", error);
  }

  // If no valid data found, initialize with default data
  saveBikesToStorage(defaultBikes);
  return defaultBikes;
};

const saveBikesToStorage = (bikes: Vehicle[]): void => {
  if (typeof window === "undefined") return; // SSR safety

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bikes));
  } catch (error) {
    console.error("Error saving bikes to localStorage:", error);
  }
};

export default function VehicleList() {
  const router = useRouter();

  const [q, setQ] = useState("");
  const [status, setStatus] = useState<"ALL" | VehicleStatus>("ALL");
  const [sort, setSort] = useState<"recent" | "name" | "odo">("recent");
  const [bikes, setBikes] = useState<Vehicle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    year: new Date().getFullYear(),
    color: "",
    regNo: "",
    odoKm: "",
    location: "",
  });

  // Load bikes from localStorage on component mount
  useEffect(() => {
    const loadedBikes = loadBikesFromStorage();
    setBikes(loadedBikes);
    setIsLoading(false);
  }, []);

  // Function to update a vehicle (example usage)
  const updateVehicle = (updatedVehicle: Vehicle) => {
    const updatedBikes = bikes.map((bike) =>
      bike.id === updatedVehicle.id ? updatedVehicle : bike
    );
    setBikes(updatedBikes);
    saveBikesToStorage(updatedBikes);
  };

  // Function to add a new vehicle
  const addVehicle = (newVehicle: Omit<Vehicle, "id">) => {
    const vehicleWithId = {
      ...newVehicle,
      id: Math.max(...bikes.map((b) => b.id), 0) + 1,
    };
    const updatedBikes = [...bikes, vehicleWithId];
    setBikes(updatedBikes);
    saveBikesToStorage(updatedBikes);
  };

  // Handle form submission
  const handleCreateVehicle = ({
    isStartInspection,
  }: {
    isStartInspection: boolean;
  }) => {
    const newVehicle = {
      name: formData.name.trim() ?? "--",
      year: formData.year ?? new Date().getFullYear(),
      color: formData.color.trim() || "Unknown",
      regNo: formData.regNo.trim() ?? "--",
      odoKm: parseInt(formData.odoKm) || 0,
      location: formData.location.trim() ?? "--",
      status: "In Progress" as VehicleStatus,
      lastInspection: new Date().toISOString().split("T")[0], // Today's date in YYYY-MM-DD format
      thumb:
        "https://ik.imagekit.io/drivex/ik_productlisting/MotorcyclePlaceholder.jpg?tr=f-avif",
    };

    addVehicle(newVehicle);

    // Reset form and close modal
    setFormData({
      name: "",
      year: new Date().getFullYear(),
      color: "",
      regNo: "",
      odoKm: "",
      location: "",
    });
    setIsModalOpen(false);
    if (isStartInspection) {
      const vehicleId = bikes.length + 1;

      router.push(`/live?vehicleId=${vehicleId}`);
    }
  };

  // Handle form input changes
  const handleInputChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Function to delete a vehicle
  const deleteVehicle = (vehicleId: number) => {
    const updatedBikes = bikes.filter((bike) => bike.id !== vehicleId);
    setBikes(updatedBikes);
    saveBikesToStorage(updatedBikes);
  };

  const filtered = useMemo(() => {
    if (isLoading) return [];

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
  }, [q, status, sort, bikes, isLoading]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.10),transparent_45%),radial-gradient(ellipse_at_bottom_right,rgba(16,185,129,0.10),transparent_45%)] px-4 py-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading vehicles...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[radial-gradient(ellipse_at_top,rgba(59,130,246,0.10),transparent_45%),radial-gradient(ellipse_at_bottom_right,rgba(16,185,129,0.10),transparent_45%)] px-4 py-6">
      <div className="mx-auto max-w-7xl">
        {/* Brand + Title */}
        <div className="mb-8">
          <div className="flex items-end justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                <img
                  className="filter drop-shadow-2xl"
                  src="/logo.png"
                  alt="Logo Image"
                  width={200}
                  style={{ marginLeft: -18, marginTop: -18, marginBottom: 18 }}
                />
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
        <div className="flex flex-col md:flex-row items-center gap-2 mb-6 ">
          <Badge variant="outline" className="text-xs md:text-sm">
            Total: {filtered.length}/{bikes.length}
          </Badge>
          <p className="text-xs md:text-sm text-gray-600">
            Select a vehicle to view details or start inspection
          </p>
          <div className="flex gap-4 md:justify-end">
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild></DialogTrigger>
              <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Bike className="h-5 w-5" />
                    Add New Vehicle
                  </DialogTitle>
                  <DialogDescription>
                    Enter the vehicle details to create a new inspection lead.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                  {/* Vehicle Name */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Vehicle Name *
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        handleInputChange("name", e.target.value)
                      }
                      placeholder="e.g., Royal Enfield Classic 350"
                      className="col-span-3"
                    />
                  </div>

                  {/* Registration Number */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="regNo" className="text-right">
                      Registration No *
                    </Label>
                    <Input
                      id="regNo"
                      value={formData.regNo}
                      onChange={(e) =>
                        handleInputChange("regNo", e.target.value.toUpperCase())
                      }
                      placeholder="e.g., MH12 AB 3456"
                      className="col-span-3"
                    />
                  </div>

                  {/* Year and Color Row */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="year" className="text-right">
                      Year
                    </Label>
                    <Select
                      value={formData.year.toString()}
                      onValueChange={(value) =>
                        handleInputChange("year", parseInt(value))
                      }
                    >
                      <SelectTrigger className="col-span-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from(
                          { length: 25 },
                          (_, i) => new Date().getFullYear() - i
                        ).map((year) => (
                          <SelectItem key={year} value={year.toString()}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Label htmlFor="color" className="text-right">
                      Color
                    </Label>
                    <Input
                      id="color"
                      value={formData.color}
                      onChange={(e) =>
                        handleInputChange("color", e.target.value)
                      }
                      placeholder="e.g., Black"
                      className="col-span-1"
                    />
                  </div>

                  {/* Odometer */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="odoKm" className="text-right">
                      Odometer (KM) *
                    </Label>
                    <Input
                      id="odoKm"
                      type="number"
                      value={formData.odoKm}
                      onChange={(e) =>
                        handleInputChange("odoKm", e.target.value)
                      }
                      placeholder="e.g., 12500"
                      className="col-span-3"
                      min="0"
                    />
                  </div>

                  {/* Location */}
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="location" className="text-right">
                      Location *
                    </Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) =>
                        handleInputChange("location", e.target.value)
                      }
                      placeholder="e.g., Mumbai Yard A"
                      className="col-span-3"
                    />
                  </div>

                  {/* Info Note */}
                  <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700">
                      <strong>Note:</strong> The vehicle will be automatically
                      set to "In Progress" status with today's date as the
                      inspection date.
                    </p>
                  </div>
                </div>

                <DialogFooter className="p-2 flex-col md:flex-row gap-4 items-center justify-center">
                  <div className="flex gap-4 items-center justify-center">
                    <Button
                      type="button"
                      onClick={() =>
                        handleCreateVehicle({ isStartInspection: false })
                      }
                      className="text-white hover:scale-105 transition-transform bg-black hover:bg-gray-600"
                    >
                      Create Lead
                    </Button>
                    <Button
                      type="button"
                      onClick={() =>
                        handleCreateVehicle({ isStartInspection: true })
                      }
                      className="text-white hover:scale-105 transition-transform bg-black hover:bg-gray-600"
                    >
                      Start Inspection
                    </Button>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              variant="default"
              className="text-white hover:scale-105 transition-transform bg-black hover:bg-gray-600"
              onClick={() => handleCreateVehicle({ isStartInspection: true })}
            >
              <Plus className="h-4 w-4" />
              Create New
            </Button>

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
          </div>
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
