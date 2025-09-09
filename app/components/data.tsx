import {
  TrendingUp,
  Users,
  Clock,
  CheckCircle,
  Settings,
  AlertTriangle,
  Camera,
  Activity,
} from "lucide-react";

export const stats = [
  {
    icon: Users,
    label: "Active Inspectors",
    value: "12",
    trend: "+2 this week",
    color: "text-blue-600",
  },
  {
    icon: TrendingUp,
    label: "Completion Rate",
    value: "94%",
    trend: "+5% vs last month",
    color: "text-emerald-600",
  },
  {
    icon: Clock,
    label: "Avg. Time",
    value: "2.5h",
    trend: "-0.3h improvement",
    color: "text-purple-600",
  },
  {
    icon: CheckCircle,
    label: "Passed Vehicles",
    value: "847",
    trend: "+23 today",
    color: "text-green-600",
  },
];
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
  lastInspection?: string;
  thumb?: string;
};

// Dummy stats data
export const bikes: Vehicle[] = [
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

// Mock data for issues
export const mockIssues = [
  {
    id: 1,
    title: "Brake Pad Wear",
    severity: "High",
    status: "Open",
    description:
      "Front brake pads showing significant wear, replacement recommended",
    category: "Safety",
  },
  {
    id: 2,
    title: "Oil Level Low",
    severity: "Medium",
    status: "In Progress",
    description: "Engine oil level below recommended minimum",
    category: "Maintenance",
  },
  {
    id: 3,
    title: "Tire Pressure",
    severity: "Low",
    status: "Resolved",
    description: "Rear tire pressure was 5 PSI below recommended level",
    category: "Routine",
  },
];

// Mock media data
export const mockMedia = [
  {
    id: 1,
    type: "image",
    title: "Engine Bay",
    url: "/images/engine.jpg",
    timestamp: "2025-09-10T10:30:00",
  },
  {
    id: 2,
    type: "video",
    title: "Brake Test",
    url: "/videos/brake-test.mp4",
    duration: "2:45",
    timestamp: "2025-09-10T11:15:00",
  },
  {
    id: 3,
    type: "image",
    title: "Dashboard",
    url: "/images/dashboard.jpg",
    timestamp: "2025-09-10T10:45:00",
  },
  {
    id: 4,
    type: "video",
    title: "Road Test",
    url: "/videos/road-test.mp4",
    duration: "5:20",
    timestamp: "2025-09-10T12:00:00",
  },
];

// Mock summary data
export const mockSummary = {
  overallScore: 85,
  categories: [
    { name: "Engine", score: 92, status: "Good" },
    { name: "Brakes", score: 75, status: "Attention Needed" },
    { name: "Tires", score: 88, status: "Good" },
    { name: "Lights", score: 95, status: "Excellent" },
    { name: "Suspension", score: 82, status: "Good" },
    { name: "Electrical", score: 90, status: "Good" },
  ],
  recommendations: [
    "Replace front brake pads within 500km",
    "Top up engine oil at next service",
    "Check tire alignment during next maintenance",
  ],
};

export const tabs = [
  { id: "details", label: "Details", icon: Settings },
  { id: "issues", label: "Issues", icon: AlertTriangle },
  { id: "media", label: "Media", icon: Camera },
  { id: "summary", label: "Summary", icon: Activity },
];
