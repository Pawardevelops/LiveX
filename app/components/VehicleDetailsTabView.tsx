"use client";
import React, { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  AlertTriangle,
  CheckCircle,
  Camera,
  Video,
  Play,
  Settings,
  Activity,
  Wrench,
  Fuel,
  Battery,
  Thermometer,
  X,
  Download,
  ZoomIn,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";
import { mockMedia } from "./data";
import AnnotatedImageViewer from "./AnnotatedImageViewer";

// Types for JSON data structure
interface VehicleData {
  details: {
    vehicle: {
      vehicleId: string;
      make: string;
      model: string;
      year: number | null;
      color: string | null;
      regNo?: string;
      location?: string;
      status?: string;
    };
    inspection: {
      inspectionStartTime: string;
      inspectionEndTime: string;
      status: string;
      summary: string;
    };
  };
  condition: {
    vehicleCondition: {
      front: string;
      back: string;
      right: string;
      lights: string;
      odometer: string;
      extras: {
        [key: string]: string;
      };
      recommendation: string[];
    };
    inspectionCondition: {
      inspectionCompleted: boolean;
    };
  };
  issues?: Issue[];
  media?: MediaItem[];
  performanceMetrics?: PerformanceMetric[];
  categoryBreakdown?: CategoryScore[];
  overallScore?: number;
}

interface Issue {
  id: string;
  title: string;
  description: string;
  severity: "High" | "Medium" | "Low";
  status: "Open" | "In Progress" | "Resolved";
  category: string;
}

interface MediaItem {
  id: string;
  title: string;
  type: "image" | "video";
  url: string;
  timestamp: string;
  duration?: string;
}

interface PerformanceMetric {
  label: string;
  value: number;
  icon: string;
  color: string;
}

interface CategoryScore {
  name: string;
  score: number;
  status: string;
}

// Default JSON data structure
let defaultJsonData: VehicleData = {
  details: {
    vehicle: {
      vehicleId: "",
      make: "",
      model: "",
      year: null,
      color: null,
      regNo: "",
      location: "",
      status: "",
    },
    inspection: {
      inspectionStartTime: "",
      inspectionEndTime: "",
      status: "",
      summary: "",
    },
  },
  condition: {
    vehicleCondition: {
      front: "",
      back: "",
      right: "",
      lights: "",
      odometer: "",
      extras: {},
      recommendation: [],
    },
    inspectionCondition: {
      inspectionCompleted: false,
    },
  },
  issues: [],
  media: [],
  performanceMetrics: [],
  categoryBreakdown: [],
  overallScore: 0,
};
// Tab configuration
const tabs = [
  { id: "details", label: "Details", icon: Settings },
  { id: "issues", label: "Issues", icon: AlertTriangle },
  { id: "media", label: "Media", icon: Camera },
  { id: "summary", label: "Summary", icon: Activity },
];

// Icon mapping for performance metrics
const iconMap = {
  Settings,
  Fuel,
  Battery,
  Thermometer,
};

// Media Preview Modal Component
const MediaPreviewModal = ({
  media,
  onClose,
}: {
  media: MediaItem;
  onClose: () => void;
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const isVideo =
    media.type === "video" ||
    media.url.includes(".webm") ||
    media.url.includes(".mp4");

  const handleMediaLoad = () => {
    setIsLoading(false);
  };

  const handleMediaError = () => {
    setIsLoading(false);
    setHasError(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.5, opacity: 0 }}
        className="relative max-w-4xl max-h-[90vh] w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-white">
            <h3 className="text-xl font-semibold">{media.title}</h3>
            <p className="text-white/70 text-sm">
              {new Date(media.timestamp).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="secondary"
              onClick={() => window.open(media.url, "_blank")}
              className="bg-white/10 hover:bg-white/20 text-white border-0"
              title="Download"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="secondary"
              onClick={onClose}
              className="bg-white/10 hover:bg-white/20 text-white border-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Media Content */}
        <div className="relative bg-black rounded-lg overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
            </div>
          )}

          {hasError ? (
            <div className="aspect-video flex items-center justify-center bg-gray-900 text-white">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-red-400" />
                <p className="text-lg mb-2">Failed to load media</p>
                <p className="text-sm text-gray-400">
                  The file might not be available
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4"
                  onClick={() => window.open(media.url, "_blank")}
                >
                  Try Direct Link
                </Button>
              </div>
            </div>
          ) : isVideo ? (
            <video
              src={media.url}
              controls
              className="w-full max-h-[70vh] object-contain"
              onLoadedData={handleMediaLoad}
              onError={handleMediaError}
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            <img
              src={media.url}
              alt={media.title}
              className="w-full max-h-[70vh] object-contain"
              onLoad={handleMediaLoad}
              onError={handleMediaError}
            />
          )}
        </div>

        {/* Media Info */}
        <div className="mt-4 text-white/80 text-sm">
          <div className="flex items-center justify-between">
            <span>Type: {media.type}</span>
            {media.duration && <span>Duration: {media.duration}</span>}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const VehicleDetailsTabView = ({
  bike,
  vehicleSummary,
}: {
  bike: any;
  vehicleSummary: any;
}) => {
  const [activeTab, setActiveTab] = useState("details");
  const [previewMedia, setPreviewMedia] = useState<any>(null);

  const params = useParams();
  const vehicleId = params.id ? params.id : "";

  const [vehicleDetail, setVehicleDetail] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/ocr/?vehicleId=${vehicleId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const cleanedString = data.analysis.replace(/```json\n|\n```/g, "");
        const parsedAnalysis = JSON.parse(cleanedString);
        setVehicleDetail(parsedAnalysis);
      } catch (e) {
        console.error("Error parsing JSON:", e);
      }
    };
    fetchData();
  }, []);

  const finalData: any = vehicleDetail ?? defaultJsonData;

  const vehicleRecommendations =
    finalData.condition.vehicleCondition.recommendation || [];
  const vehicleSummaryData = finalData.details.inspection.summary || "";
  const vehicleIssues = finalData.condition.vehicleCondition || {};
  const vehicleDetails = finalData.details.vehicle || {};
  const vehicleInspectionStatus = finalData.details.inspection.status || "";

  const vehicleImageType = [
    { type: "front_tyre", name: "Front Tyre" },
    { type: "front_tyre_gauge", name: "Front Tyre Gauge" },
    { type: "right_photo", name: "Right" },
    { type: "back_photo", name: "Back" },
    { type: "back_tyre_gauge", name: "Back Tyre Gauge" },
    { type: "left_photo", name: "Left" },
    { type: "odometer_value", name: "Odometer" },
  ];
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mx-auto max-w-6xl mb-6"
      >
        <Card className="border-white/60 bg-white/85 backdrop-blur">
          <CardContent className="p-2">
            <div className="flex gap-1">
              {tabs.map((tab) => (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  className={`flex-1 flex items-center gap-2 h-12 ${
                    activeTab === tab.id
                      ? "bg-gray-900 text-white"
                      : "hover:bg-white/50"
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{tab.label}</span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="mx-auto max-w-6xl">
        <AnimatePresence mode="wait">
          {/* Details Tab */}
          {activeTab === "details" && (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="border-white/60 bg-white/85 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Vehicle Details & Specifications
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div>
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">
                        Basic Information
                      </h3>
                      <div className="grid md:grid-cols-4 grid-cols-2 gap-4">
                        {[
                          {
                            label: "Make & Model",
                            value:
                              vehicleDetails.make + " " + vehicleDetails.model,
                          },
                          { label: "Year", value: vehicleDetails.year ?? "-" },
                          {
                            label: "Color",
                            value: vehicleDetails.color ?? "-",
                          },
                          {
                            label: "Registration",
                            value: vehicleDetails.regNo ?? "-",
                          },
                          {
                            label: "Current Location",
                            value: vehicleDetails.location ?? "-",
                          },
                          {
                            label: "Status",
                            value: vehicleInspectionStatus ?? "-",
                          },
                        ].map((item, index) => (
                          <motion.div
                            key={item.label}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-gray-50 rounded-lg p-3"
                          >
                            <div className="text-xs text-gray-500 mb-1">
                              {item.label}
                            </div>
                            <div className="font-medium">{item.value}</div>
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Issues Tab */}
          {activeTab === "issues" && (
            <motion.div
              key="issues"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="border-white/60 bg-white/85 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Issues & Findings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02 }}
                      className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer flex flex-col gap-5"
                    >
                      <div>
                        {vehicleIssues.back && (
                          <div className="flex items-center justify-between">
                            <p className="text-gray-600 mb-2">Back Condition</p>
                            <p className="text-gray-600 mb-2">
                              {vehicleIssues.back}
                            </p>
                          </div>
                        )}
                        {vehicleIssues.front && (
                          <div className="flex items-center justify-between">
                            <p className="text-gray-600 mb-2">
                              Front Condition
                            </p>
                            <p className="text-gray-600 mb-2">
                              {vehicleIssues.front}
                            </p>
                          </div>
                        )}
                        {vehicleIssues.lights && (
                          <div className="flex items-center justify-between">
                            <p className="text-gray-600 mb-2">
                              Lights Condition
                            </p>
                            <p className="text-gray-600 mb-2">
                              {vehicleIssues.lights}
                            </p>
                          </div>
                        )}
                        {vehicleIssues.odometer && (
                          <div className="flex items-center justify-between">
                            <p className="text-gray-600 mb-2">
                              Odometer Condition
                            </p>
                            <p className="text-gray-600 mb-2">
                              {vehicleIssues.odometer}
                            </p>
                          </div>
                        )}
                        {vehicleIssues.right && (
                          <div className="flex items-center justify-between">
                            <p className="text-gray-600 mb-2">
                              Right Condition
                            </p>
                            <p className="text-gray-600 mb-2">
                              {vehicleIssues.right}
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="border-white/60 bg-white/85 backdrop-blur rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <Wrench className="h-5 w-5" />
                          <span className="font-medium">
                            Vehicle Other Issues
                          </span>
                        </div>

                        {Object.keys(vehicleIssues.extras).length > 0 ? (
                          <div className="space-y-3">
                            {Object.entries(vehicleIssues.extras).map(
                              ([key, description], index) => (
                                <motion.div
                                  key={key}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: index * 0.1 }}
                                  className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200"
                                >
                                  <div className="flex flex-col gap-2">
                                    <span className="font-medium">{key}</span>
                                    <div className="flex items-center gap-2">
                                      <span className="text-blue-800">
                                        {description as string}
                                      </span>
                                    </div>
                                  </div>
                                </motion.div>
                              )
                            )}
                          </div>
                        ) : (
                          <p className="text-gray-500">
                            No other issues reported.
                          </p>
                        )}
                      </div>
                    </motion.div>
                  </div>

                  <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 border rounded-lg shadow-sm mt-10">
                    {vehicleSummary?.defects?.length > 0 ? (
                      vehicleSummary.defects.map((d: any, index: any) => (
                        <div key={index} className=" bg-white">
                          <h3 className="text-lg font-semibold mb-2">
                            Defect Identified in{" "}
                            {vehicleImageType.find(
                              (item) => item.type === d.Type
                            )?.name ?? ""}
                          </h3>
                          <p className="text-gray-700 mb-4">
                            {d?.description || "No description available."}
                          </p>

                          <span className="w-[300px] md:w-full">
                            <AnnotatedImageViewer
                              imageUrl={`https://livex-po-bucket.s3.ap-south-1.amazonaws.com/${vehicleId}/${d.Type}.png`}
                              analysisData={{ defects: [d] }}
                            />
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500">No defects found.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Media Tab */}
          {activeTab === "media" && (
            <motion.div
              key="media"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <Card className="border-white/60 bg-white/85 backdrop-blur">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    Images & Videos ({mockMedia(vehicleId).length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mockMedia(vehicleId).map((item, index) => {
                      const isVideo =
                        item.type === "video" ||
                        item.url.includes(".webm") ||
                        item.url.includes(".mp4");

                      return (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.1 }}
                          whileHover={{ scale: 1.02 }}
                          className="relative bg-gray-100 rounded-lg overflow-hidden cursor-pointer group"
                          onClick={() => setPreviewMedia(item)}
                        >
                          <div className="aspect-video relative">
                            {isVideo ? (
                              <div className="w-full h-full bg-black flex items-center justify-center">
                                <video
                                  src={item.url}
                                  className="w-full h-full object-cover"
                                  muted
                                  preload="metadata"
                                />
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                  <Play className="h-12 w-12 text-white" />
                                </div>
                              </div>
                            ) : (
                              <div className="w-full h-full relative">
                                <img
                                  src={item.url}
                                  alt={`${bike.name} photo`}
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                  onError={(e) => {
                                    e.currentTarget.src =
                                      "https://ik.imagekit.io/drivex/ik_productlisting/MotorcyclePlaceholder.jpg?tr=f-avif";
                                  }}
                                />
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                  <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Overlay Info */}
                          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-3">
                            <div className="text-white text-sm font-medium mb-1">
                              {item.title}
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="text-white/70 text-xs">
                                {new Date(item.timestamp).toLocaleDateString()}
                              </div>
                              {item.duration && (
                                <Badge variant="secondary" className="text-xs">
                                  {item.duration}
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Type Badge */}
                          <div className="absolute top-2 right-2">
                            {isVideo ? (
                              <Badge className="bg-red-500 hover:bg-red-600">
                                <Video className="h-3 w-3 mr-1" />
                                Video
                              </Badge>
                            ) : (
                              <Badge className="bg-blue-500 hover:bg-blue-600">
                                <Camera className="h-3 w-3 mr-1" />
                                Photo
                              </Badge>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Summary Tab */}
          {activeTab === "summary" && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="space-y-6">
                {/* Overall Score */}
                {vehicleSummaryData !== "" ? (
                  <Card className="border-white/60 bg-white/85 backdrop-blur">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Summary of the Vehicle
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div>
                        <p>{vehicleSummaryData}</p>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <p>No summary available</p>
                )}
                {/* Recommendations */}
                <Card className="border-white/60 bg-white/85 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wrench className="h-5 w-5" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {vehicleRecommendations.length > 0 ? (
                      <div className="space-y-3">
                        {vehicleRecommendations.map(
                          (rec: string, index: number) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200"
                            >
                              <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                              <span className="text-blue-800">{rec}</span>
                            </motion.div>
                          )
                        )}
                      </div>
                    ) : (
                      <p>No recommendations available.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Media Preview Modal */}
      <AnimatePresence>
        {previewMedia && (
          <MediaPreviewModal
            media={previewMedia}
            onClose={() => setPreviewMedia(null)}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default VehicleDetailsTabView;
