"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Bell,
  BookOpen,
  CalendarDays,
  CheckCircle,
  Clock,
  Github,
  GraduationCap as StudentIcon,
  MapPinned,
  Users,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { PortalNav } from "@/components/portal/portal-nav";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type {
  Announcement,
  PortalProject,
  RaggingReport,
} from "@/types/portal";
import type { IEvent } from "@/calendar/interfaces";

export default function StudentDashboard() {
  const { authenticated, loading, name, email, userId, logout } =
    useAuth("student");
  const router = useRouter();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [myProjects, setMyProjects] = useState<PortalProject[]>([]);
  const [myReports, setMyReports] = useState<RaggingReport[]>([]);
  const [events, setEvents] = useState<IEvent[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Professional loading sequence
    const timer = setTimeout(() => setIsLoaded(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const fetchData = useCallback(async () => {
    const [annsRes, projRes, eventsRes] = await Promise.all([
      fetch("/api/portal/announcements"),
      fetch("/api/portal/projects"),
      fetch("/api/portal/events"),
    ]);
    if (annsRes.ok) setAnnouncements(await annsRes.json());
    if (projRes.ok) {
      const projs: PortalProject[] = await projRes.json();
      setMyProjects(projs.filter((p) => p.submittedBy === userId));
    }
    if (eventsRes.ok) setEvents(await eventsRes.json());
  }, [userId]);

  useEffect(() => {
    if (authenticated) fetchData();
  }, [authenticated, fetchData]);

  // Poll every 8s for live updates from staff
  useEffect(() => {
    const id = setInterval(() => {
      if (authenticated) fetchData();
    }, 8000);
    return () => clearInterval(id);
  }, [authenticated, fetchData]);

  if (loading || !isLoaded) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center"
        >
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center mb-6 shadow-2xl shadow-red-600/20">
            <StudentIcon size={40} className="text-white" />
          </div>
          <h2 className="text-white font-black text-xl tracking-[0.2em]">
            CU-UP
          </h2>
          <div className="mt-4 flex gap-1.5">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ scale: [1, 1.4, 1], opacity: [0.3, 1, 0.3] }}
                transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }}
                className="w-2 h-2 rounded-full bg-red-600"
              />
            ))}
          </div>
          <p className="text-zinc-500 text-xs mt-8 uppercase tracking-widest font-bold">
            Initializing Student Portal...
          </p>
        </motion.div>
      </div>
    );
  }

  if (!authenticated) return null;

  const pendingProjects = myProjects.filter(
    (p) => p.status === "pending",
  ).length;
  const approvedProjects = myProjects.filter(
    (p) => p.status === "approved" || p.status === "featured",
  ).length;

  return (
    <div className="flex min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <PortalNav role="student" name={name} email={email} onLogout={logout} />

      <main className="flex-1 p-8 overflow-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-white">
              Welcome back, {name.split(" ")[0]} 👋
            </h1>
            <p className="text-zinc-500 mt-1">
              Chandigarh University, Uttar Pradesh
            </p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[
              {
                label: "My Projects",
                value: myProjects.length,
                icon: <Github className="h-5 w-5" />,
                color: "text-blue-600",
                bg: "bg-blue-50 dark:bg-blue-900/20",
              },
              {
                label: "Pending Review",
                value: pendingProjects,
                icon: <Clock className="h-5 w-5" />,
                color: "text-amber-600",
                bg: "bg-amber-50 dark:bg-amber-900/20",
              },
              {
                label: "Approved",
                value: approvedProjects,
                icon: <CheckCircle className="h-5 w-5" />,
                color: "text-green-600",
                bg: "bg-green-50 dark:bg-green-900/20",
              },
              {
                label: "Announcements",
                value: announcements.length,
                icon: <Bell className="h-5 w-5" />,
                color: "text-red-600",
                bg: "bg-red-50 dark:bg-red-900/20",
              },
            ].map((stat) => (
              <Card key={stat.label} className="border-0 shadow-sm">
                <CardContent className="p-5 flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${stat.bg}`}>
                    <div className={stat.color}>{stat.icon}</div>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-zinc-900 dark:text-white">
                      {stat.value}
                    </p>
                    <p className="text-xs text-zinc-500">{stat.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-0 shadow-sm mb-8 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
            <CardContent className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-sm/none uppercase tracking-wide text-emerald-100">
                  New Feature
                </p>
                <h2 className="text-2xl font-bold mt-2">Campus QR Locator</h2>
                <p className="mt-1 text-emerald-50">
                  Scan QR, see your live location, and navigate yourself across
                  campus.
                </p>
              </div>
              <Button
                asChild
                variant="secondary"
                className="bg-white text-emerald-700 hover:bg-emerald-50"
              >
                <Link href="/student/location">
                  <MapPinned className="h-4 w-4" /> Open Locator
                </Link>
              </Button>
            </CardContent>
          </Card>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Announcements */}
            <div className="lg:col-span-2">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Bell className="h-4 w-4 text-red-600" /> Announcements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {announcements.length === 0 ? (
                    <p className="text-zinc-400 text-sm text-center py-6">
                      No announcements right now
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {announcements.slice(0, 5).map((ann) => (
                        <div
                          key={ann.id}
                          className={`p-4 rounded-xl border ${ann.priority === "urgent" ? "border-red-200 bg-red-50 dark:bg-red-900/10 dark:border-red-800" : "border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900"}`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-sm text-zinc-900 dark:text-white">
                              {ann.title}
                            </p>
                            {ann.priority === "urgent" && (
                              <Badge
                                variant="destructive"
                                className="text-xs shrink-0"
                              >
                                Urgent
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                            {ann.content}
                          </p>
                          <p className="text-xs text-zinc-400 mt-2">
                            — {ann.postedByName} ·{" "}
                            {new Date(ann.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Zap className="h-4 w-4 text-amber-500" /> Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    asChild
                    className="w-full justify-start gap-2 bg-red-700 hover:bg-red-800 text-white"
                  >
                    <Link href="/student/ragging">
                      <AlertTriangle className="h-4 w-4" /> Report Ragging
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-start gap-2"
                  >
                    <Link href="/student/projects">
                      <Github className="h-4 w-4" /> Submit GitHub Project
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-start gap-2 border-blue-200"
                  >
                    <a
                      href="https://dryrun1002.vercel.app"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <BookOpen className="h-4 w-4 text-blue-600" /> DSA
                      Practice
                    </a>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-start gap-2 border-blue-200"
                  >
                    <a
                      href="https://roadmap.sh/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <BookOpen className="h-4 w-4 text-blue-600" /> Career
                      Roadmaps
                    </a>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-start gap-2 border-purple-200"
                  >
                    <a
                      href="https://oculink.in"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Zap className="h-4 w-4 text-purple-600" /> Resume Builder
                    </a>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-start gap-2 border-sky-200"
                  >
                    <Link href="/calendar">
                      <CalendarDays className="h-4 w-4 text-sky-600" /> View
                      Events
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-start gap-2"
                  >
                    <Link href="/communities">
                      <Users className="h-4 w-4" /> Browse Clubs
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant="outline"
                    className="w-full justify-start gap-2 border-emerald-200"
                  >
                    <Link href="/student/location">
                      <MapPinned className="h-4 w-4 text-emerald-600" /> Scan
                      Campus QR
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              {/* My Recent Projects */}
              {myProjects.length > 0 && (
                <Card className="border-0 shadow-sm">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">My Submissions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {myProjects.slice(0, 3).map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between"
                      >
                        <p className="text-sm font-medium truncate text-zinc-800 dark:text-zinc-200">
                          {p.name}
                        </p>
                        <Badge
                          variant={
                            p.status === "approved" || p.status === "featured"
                              ? "default"
                              : p.status === "rejected"
                                ? "destructive"
                                : "secondary"
                          }
                          className="text-xs"
                        >
                          {p.status}
                        </Badge>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Ongoing Campus Events */}
          <div className="mt-8">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <CalendarDays className="h-4 w-4 text-green-600" /> Ongoing
                  Campus Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const now = new Date();
                  const ongoingEvents = events
                    .map((e) => ({
                      ...e,
                      start: new Date(e.startDateTime),
                      end: new Date(e.endDateTime),
                    }))
                    .filter((e) => {
                      const isOngoing = e.start <= now && e.end >= now;
                      const isUpcomingTag =
                        e.tags?.includes("upcoming") && e.start >= now;
                      return isOngoing || isUpcomingTag;
                    });

                  return ongoingEvents.length === 0 ? (
                    <p className="text-zinc-400 text-sm text-center py-6">
                      No events currently ongoing on campus
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {ongoingEvents.slice(0, 5).map((event) => {
                        const isUpcoming =
                          event.tags?.includes("upcoming") && event.start > now;
                        return (
                          <div
                            key={event.id}
                            className="p-4 rounded-xl border border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <p className="font-semibold text-sm text-zinc-900 dark:text-white">
                                {event.title}
                              </p>
                              <Badge
                                variant="outline"
                                className="text-xs shrink-0"
                              >
                                {isUpcoming ? "Upcoming" : "Ongoing"}
                              </Badge>
                            </div>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">
                              {event.description}
                            </p>
                            <p className="text-xs text-zinc-400 mt-2">
                              📍 {event.location} · 🕒 {event.time}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-zinc-500 text-sm">Loading portal…</p>
      </div>
    </div>
  );
}
