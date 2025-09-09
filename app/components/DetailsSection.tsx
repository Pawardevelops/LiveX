"use client";
import React, { useState } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { stats } from "./data";
import { Bike } from "lucide-react";

const DetailsSection = () => {
  const [hoveredStat, setHoveredStat] = useState<number | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
      {/* Left Side - Stats */}
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Inspection Overview
          </h2>
          <p className="text-gray-600 mb-6">
            Real-time insights into your vehicle inspection operations. Track
            performance, monitor progress, and optimize your workflow with
            comprehensive analytics.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              className="relative"
              onHoverStart={() => setHoveredStat(index)}
              onHoverEnd={() => setHoveredStat(null)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="border-white/60 bg-white/90 backdrop-blur cursor-pointer overflow-hidden">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                    <motion.div
                      animate={{
                        rotate: hoveredStat === index ? 360 : 0,
                      }}
                      transition={{ duration: 0.5 }}
                      className={`w-2 h-2 rounded-full ${stat.color.replace(
                        "text-",
                        "bg-"
                      )}`}
                    />
                  </div>
                  <div className="text-2xl font-bold text-gray-900 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs text-gray-500 mb-2">{stat.label}</div>
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{
                      opacity: hoveredStat === index ? 1 : 0.7,
                      y: hoveredStat === index ? 0 : 5,
                    }}
                    transition={{ duration: 0.2 }}
                    className="text-xs text-emerald-600 font-medium"
                  >
                    {stat.trend}
                  </motion.div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Right Side - Interactive Bike */}
      <div className="flex items-center justify-center">
        <motion.div
          className="relative w-full max-w-md h-80 flex items-center justify-center"
          whileHover="hover"
        >
          {/* Bike Container */}
          <motion.div
            className="relative w-72 h-72 rounded-full bg-gradient-to-br from-blue-100 via-white to-emerald-100 border border-white/60 backdrop-blur shadow-xl flex items-center justify-center"
            variants={{
              hover: {
                scale: 1.05,
                rotate: [0, -2, 2, 0],
                transition: {
                  rotate: {
                    repeat: Infinity,
                    duration: 4,
                    ease: "easeInOut",
                  },
                },
              },
            }}
            whileTap={{ scale: 0.98 }}
          >
            {/* Decorative rings */}
            <motion.div
              className="absolute inset-4 rounded-full border-2 border-blue-200/50"
              variants={{
                hover: {
                  rotate: 360,
                  transition: {
                    duration: 8,
                    ease: "linear",
                    repeat: Infinity,
                  },
                },
              }}
            />
            <motion.div
              className="absolute inset-8 rounded-full border border-emerald-200/50"
              variants={{
                hover: {
                  rotate: -360,
                  transition: {
                    duration: 12,
                    ease: "linear",
                    repeat: Infinity,
                  },
                },
              }}
            />

            {/* Main Bike Icon */}
            <motion.div
              variants={{
                hover: {
                  y: [-5, 5, -5],
                  transition: {
                    repeat: Infinity,
                    duration: 3,
                    ease: "easeInOut",
                  },
                },
              }}
            >
              <Bike className="h-20 w-20 text-gray-700" />
            </motion.div>

            {/* Floating elements */}
            <motion.div
              className="absolute top-6 right-6 w-3 h-3 rounded-full bg-blue-400"
              variants={{
                hover: {
                  scale: [1, 1.5, 1],
                  opacity: [0.5, 1, 0.5],
                  transition: {
                    repeat: Infinity,
                    duration: 2,
                    ease: "easeInOut",
                  },
                },
              }}
            />
            <motion.div
              className="absolute bottom-8 left-8 w-2 h-2 rounded-full bg-emerald-400"
              variants={{
                hover: {
                  scale: [1, 1.2, 1],
                  opacity: [0.7, 1, 0.7],
                  transition: {
                    repeat: Infinity,
                    duration: 1.5,
                    ease: "easeInOut",
                    delay: 0.5,
                  },
                },
              }}
            />
            <motion.div
              className="absolute top-12 left-12 w-1.5 h-1.5 rounded-full bg-purple-400"
              variants={{
                hover: {
                  scale: [1, 1.8, 1],
                  opacity: [0.4, 1, 0.4],
                  transition: {
                    repeat: Infinity,
                    duration: 2.5,
                    ease: "easeInOut",
                    delay: 1,
                  },
                },
              }}
            />
          </motion.div>

          {/* Interactive prompt */}
          <motion.div
            className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 text-center"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <p className="text-sm text-gray-500 font-medium">
              Hover to interact
            </p>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default DetailsSection;
