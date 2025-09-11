"use client";
import React, { useState } from "react";
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
import { mockIssues, mockMedia, mockSummary, tabs } from "./data";
import { Button } from "@/components/ui/button";
import { useParams } from "next/navigation";

// Media Preview Modal Component
const MediaPreviewModal = ({
  media,
  onClose,
}: {
  media: any;
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

const VehicleDetailsTabView = ({ bike }: { bike: any }) => {
  const [activeTab, setActiveTab] = useState("details");
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [previewMedia, setPreviewMedia] = useState<any>(null);

  const severityColors = {
    High: "text-red-600 bg-red-50",
    Medium: "text-orange-600 bg-orange-50",
    Low: "text-green-600 bg-green-50",
  };

  const statusColors = {
    Open: "text-red-600 bg-red-50",
    "In Progress": "text-blue-600 bg-blue-50",
    Resolved: "text-green-600 bg-green-50",
  };

  const params = useParams();
  const vehicleId = params.id ? params.id : "";

  const handleMediaClick = (item: any) => {
    setPreviewMedia(item);
  };

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
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">
                        Basic Information
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { label: "Make & Model", value: bike.name },
                          { label: "Year", value: bike.year },
                          { label: "Color", value: bike.color },
                          { label: "Registration", value: bike.regNo },
                          { label: "Current Location", value: bike.location },
                          { label: "Status", value: bike.status },
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

                    <div className="space-y-4">
                      <h3 className="font-semibold text-lg">
                        Performance Metrics
                      </h3>
                      <div className="space-y-4">
                        {[
                          {
                            label: "Engine Health",
                            value: 92,
                            icon: Settings,
                            color: "text-green-600",
                          },
                          {
                            label: "Fuel Efficiency",
                            value: 78,
                            icon: Fuel,
                            color: "text-blue-600",
                          },
                          {
                            label: "Battery Status",
                            value: 85,
                            icon: Battery,
                            color: "text-purple-600",
                          },
                          {
                            label: "Temperature",
                            value: 68,
                            icon: Thermometer,
                            color: "text-orange-600",
                          },
                        ].map((metric, index) => (
                          <motion.div
                            key={metric.label}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-gray-50 rounded-lg p-4"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <metric.icon
                                  className={`h-4 w-4 ${metric.color}`}
                                />
                                <span className="font-medium">
                                  {metric.label}
                                </span>
                              </div>
                              <span className="font-bold">{metric.value}%</span>
                            </div>
                            <Progress value={metric.value} className="h-2" />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

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
                    Issues & Findings ({mockIssues.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockIssues.map((issue, index) => (
                      <motion.div
                        key={issue.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="font-semibold text-lg">
                            {issue.title}
                          </h3>
                          <div className="flex gap-2">
                            <Badge
                              className={
                                severityColors[
                                  issue.severity as keyof typeof severityColors
                                ]
                              }
                            >
                              {issue.severity}
                            </Badge>
                            <Badge
                              className={
                                statusColors[
                                  issue.status as keyof typeof statusColors
                                ]
                              }
                            >
                              {issue.status}
                            </Badge>
                          </div>
                        </div>
                        <p className="text-gray-600 mb-2">
                          {issue.description}
                        </p>
                        <div className="text-sm text-gray-500">
                          Category:{" "}
                          <span className="font-medium">{issue.category}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

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
                          onClick={() => handleMediaClick(item)}
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

          {activeTab === "summary" && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="space-y-6">
                {/* Overall Score */}
                <Card className="border-white/60 bg-white/85 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Overall Vehicle Health Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center">
                      <motion.div
                        className="relative w-32 h-32"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.3, type: "spring" }}
                      >
                        <div className="w-full h-full rounded-full border-8 border-gray-200 flex items-center justify-center">
                          <div className="text-3xl font-bold text-gray-900">
                            {mockSummary.overallScore}%
                          </div>
                        </div>
                        <div
                          className="absolute inset-0 rounded-full border-8 border-transparent border-t-green-500 border-r-green-500 transform -rotate-90"
                          style={{
                            borderImage: `conic-gradient(#10b981 ${
                              mockSummary.overallScore * 3.6
                            }deg, transparent 0deg) 1`,
                          }}
                        ></div>
                      </motion.div>
                    </div>
                  </CardContent>
                </Card>

                {/* Category Breakdown */}
                <Card className="border-white/60 bg-white/85 backdrop-blur">
                  <CardHeader>
                    <CardTitle>Category Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {mockSummary.categories.map((category, index) => (
                        <motion.div
                          key={category.name}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          onHoverStart={() => setHoveredCategory(category.name)}
                          onHoverEnd={() => setHoveredCategory(null)}
                          className="bg-gray-50 rounded-lg p-4 cursor-pointer"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{category.name}</span>
                            <motion.span
                              className="font-bold"
                              animate={{
                                scale:
                                  hoveredCategory === category.name ? 1.1 : 1,
                                color:
                                  hoveredCategory === category.name
                                    ? "#059669"
                                    : "#374151",
                              }}
                            >
                              {category.score}%
                            </motion.span>
                          </div>
                          <Progress value={category.score} className="mb-2" />
                          <div className="text-sm text-gray-600">
                            {category.status}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recommendations */}
                <Card className="border-white/60 bg-white/85 backdrop-blur">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Wrench className="h-5 w-5" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {mockSummary.recommendations.map((rec, index) => (
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
                      ))}
                    </div>
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
