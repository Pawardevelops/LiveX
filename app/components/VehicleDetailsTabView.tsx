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
  Eye,
  Play,
  Settings,
  Activity,
  Wrench,
  Fuel,
  Battery,
  Thermometer,
} from "lucide-react";
import { mockIssues, mockMedia, mockSummary, tabs } from "./data";
import { Button } from "@/components/ui/button";

const VehicleDetailsTabView = ({
  bike,
  setSelectedMedia,
}: {
  bike: any;
  setSelectedMedia: (media: any) => void;
}) => {
  const [activeTab, setActiveTab] = useState("details");
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

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
                    Images & Videos ({mockMedia.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {mockMedia.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.05 }}
                        className="relative bg-gray-100 rounded-lg overflow-hidden cursor-pointer"
                        onClick={() => setSelectedMedia(item)}
                      >
                        <div className="aspect-video flex items-center justify-center">
                          {item.type === "image" ? (
                            <Camera className="h-8 w-8 text-gray-400" />
                          ) : (
                            <div className="flex flex-col items-center">
                              <Video className="h-8 w-8 text-gray-400 mb-2" />
                              <Badge variant="outline">{item.duration}</Badge>
                            </div>
                          )}
                        </div>
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center">
                          <div className="opacity-0 hover:opacity-100 transition-opacity">
                            {item.type === "image" ? (
                              <Eye className="h-6 w-6 text-white" />
                            ) : (
                              <Play className="h-6 w-6 text-white" />
                            )}
                          </div>
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 p-3">
                          <div className="text-white text-sm font-medium">
                            {item.title}
                          </div>
                          <div className="text-white/70 text-xs">
                            {new Date(item.timestamp).toLocaleString()}
                          </div>
                        </div>
                      </motion.div>
                    ))}
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
    </>
  );
};

export default VehicleDetailsTabView;
