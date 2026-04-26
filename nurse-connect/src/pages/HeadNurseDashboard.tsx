/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import {
  Calendar, Users, ArrowLeftRight, ClipboardCheck, UserPlus, LogOut,
  Menu, X, Check, XCircle, Search, Star, Trash2, Loader2, Wand2, User, Edit3, ChevronDown,
  Settings2, Zap
} from "lucide-react";
import logo from "@/assets/logo.svg";

type Tab = "schedule" | "swaps" | "performance" | "manage";

function getISOWeek(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
}

const HeadNurseDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("schedule");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const { signOut, user, session } = useAuth();
  const navigate = useNavigate();

  const [hnProfile, setHnProfile] = useState<{ name: string; department_name: string | null; photo_url: string | null } | null>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setProfileMenuOpen(false);
    if (profileMenuOpen) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [profileMenuOpen]);

  useEffect(() => {
    if (!user) return;
    const fetchProfile = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
        const token = (session as any)?.access_token;
        const res = await fetch(`${API_BASE}/db/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            table: "head_nurses",
            action: "select",
            filters: [{ field: "user_id", op: "eq", value: user.id }],
            options: { maybeSingle: true },
          }),
        });
        if (!res.ok) {
          console.error("Failed to fetch head nurse profile");
          return;
        }
        const json = await res.json();
        const row = json.data;
        if (row) {
          setHnProfile({
            name: row.name,
            department_name: row.departments?.name ?? null,
            photo_url: row.photo_url || null,
          });
        }
      } catch (err) {
        console.error("Error fetching head nurse profile", err);
      }
    };
    fetchProfile();
  }, [user, session]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const initials = hnProfile?.name
    ? hnProfile.name.split(" ").map((w) => w[0]).join("").toUpperCase()
    : "HN";

  const tabs = [
    { key: "schedule" as const, icon: Calendar, label: "Weekly Schedule" },
    { key: "swaps" as const, icon: ArrowLeftRight, label: "Swap Requests" },
    { key: "performance" as const, icon: ClipboardCheck, label: "Performance" },
    { key: "manage" as const, icon: UserPlus, label: "Manage Nurses" },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-card shadow-card transition-transform md:relative md:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 border-b p-4">
            <Link to="/">
              <img src={logo} alt="Logo" className="h-12 w-auto object-contain" />
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="ml-auto md:hidden"><X size={20} /></button>
          </div>
          <nav className="flex-1 space-y-1 p-3">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => { setActiveTab(t.key); setSidebarOpen(false); }}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${activeTab === t.key ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
              >
                <t.icon size={18} />{t.label}
              </button>
            ))}
          </nav>
          <div className="border-t p-3">
            <button onClick={handleSignOut} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted"><LogOut size={18} /> Sign Out</button>
          </div>
        </div>
      </aside>

      <main className="flex-1">
        <header className="flex items-center justify-between border-b bg-card px-4 py-3 md:px-6 relative">
          <button onClick={() => setSidebarOpen(true)} className="md:hidden"><Menu size={22} /></button>
          <div>
            <h1 className="text-lg font-bold text-foreground">Head Nurse <span className="text-primary">Dashboard</span></h1>
            {hnProfile?.department_name && (
              <p className="text-xs text-muted-foreground">{hnProfile.department_name}</p>
            )}
          </div>

          {/* Profile Menu */}
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary hover:bg-primary/20 transition-colors overflow-hidden"
            >
              <Avatar className="h-full w-full">
                {hnProfile?.photo_url ? (
                  <AvatarImage src={hnProfile.photo_url} alt={hnProfile.name} className="object-cover" />
                ) : null}
                <AvatarFallback className="bg-transparent text-sm font-bold">{initials}</AvatarFallback>
              </Avatar>
            </button>

            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 rounded-lg border border-border bg-card shadow-lg z-50">
                {/* Profile Info */}
                <div className="border-b px-4 py-3">
                  <p className="text-sm font-semibold text-foreground">{hnProfile?.name || "Head Nurse"}</p>
                  <p className="text-xs text-muted-foreground">{hnProfile?.department_name || "No Department"}</p>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      navigate("/head-nurse-profile");
                      setProfileMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                  >
                    <User size={16} />
                    <span>View Profile</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </header>

        <div className="p-4 md:p-6">
          {/* Actions */}
          {activeTab === "manage" && (
            <div className="mb-4 flex gap-2">
              <Button
                onClick={() => navigate("/assign-nurse-department")}
                variant="outline"
                className="gap-2"
              >
                <UserPlus size={16} />
                Assign Department
              </Button>
            </div>
          )}

          {activeTab === "schedule" && <HNScheduleView />}
          {activeTab === "swaps" && <HNSwapView />}
          {activeTab === "performance" && <HNPerformanceView />}
          {activeTab === "manage" && <HNManageView />}
        </div>
      </main>
    </div>
  );
};

// --- Schedule View ----------------------------------------------

interface ScheduleRow {
  id: string;
  duty_date: string;
  shift_type: string;
  nurse: { id: string; name: string; division_id: string | null } | null;
  department: { id: string; name: string } | null;
}

// Acuity colour map
const ACUITY_COLORS: Record<string, string> = {
  "Acuity 1": "bg-green-100 text-green-700 border-green-200",
  "Acuity 2": "bg-blue-100 text-blue-700 border-blue-200",
  "Acuity 3": "bg-amber-100 text-amber-700 border-amber-200",
  "Acuity 4": "bg-rose-100 text-rose-700 border-rose-200",
};

const SHIFT_LABELS: Record<string, string> = {
  day:     "Day Shift (6AM - 6PM)",
  night:   "Night Shift (6PM - 6AM)",
  // legacy labels for any old seeded data
  morning: "Morning (6AM - 2PM)",
  evening: "Evening (2PM - 10PM)",
};

const HNScheduleView = () => {
  const { user, session } = useAuth();
  const [search, setSearch] = useState("");
  const [scheduleData, setScheduleData] = useState<ScheduleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [fallbackDialog, setFallbackDialog] = useState({ open: false, message: "", prompt: "" });
  const [overwriteDialog, setOverwriteDialog] = useState({ open: false, message: "", prompt: "" });
  const [departmentId, setDepartmentId] = useState<string | null>(null);
  const [wardId, setWardId] = useState<string | null>(null);
  const [expandedDays, setExpandedDays] = useState<Set<string>>(new Set());
  const [availableNurses, setAvailableNurses] = useState<any[]>([]);
  const [editingSchedule, setEditingSchedule] = useState<ScheduleRow | null>(null);
  const [selectedNurseId, setSelectedNurseId] = useState<string>("");
  const [selectedShiftType, setSelectedShiftType] = useState<string>("");
  const [editingLoading, setEditingLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const now = new Date();
  const [selectedWeek, setSelectedWeek] = useState(getISOWeek(now));
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  
  // Schedule settings
  const [shiftPattern, setShiftPattern] = useState("12_hours");
  const [maxHoursPerWeek, setMaxHoursPerWeek] = useState(36);

  // Acuity requirements
  const [divisions, setDivisions] = useState<any[]>([]);
  const [acuityTargets, setAcuityTargets] = useState<Record<string, number>>({});
  const [showAcuityPanel, setShowAcuityPanel] = useState(false);

  // Fetch head nurse's department from backend
  useEffect(() => {
    if (!user) return;
    const fetchDepartment = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
        const token = (session as any)?.access_token;
        const res = await fetch(`${API_BASE}/db/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            table: "head_nurses",
            action: "select",
            filters: [{ field: "user_id", op: "eq", value: user.id }],
            options: { maybeSingle: true },
          }),
        });
        if (!res.ok) return;
        const json = await res.json();
        if (json.data?.department_id) setDepartmentId(json.data.department_id);
        if (json.data?.ward_id) setWardId(json.data.ward_id);
      } catch (err) {
        console.error("Error fetching head nurse department", err);
      }
    };
    fetchDepartment();
  }, [user, session]);

  // Fetch divisions
  useEffect(() => {
    const fetchDivisions = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
        const token = (session as any)?.access_token;
        const res = await fetch(`${API_BASE}/db/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ table: "divisions", action: "select" }),
        });
        if (!res.ok) return;
        const json = await res.json();
        setDivisions(json.data || []);
      } catch (err) {
        console.error("Error fetching divisions", err);
      }
    };
    fetchDivisions();
  }, [session]);

  const fetchAvailableNurses = useCallback(async () => {
    if (!departmentId) return;
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
      const token = (session as any)?.access_token;
      const res = await fetch(`${API_BASE}/db/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          table: "nurses",
          action: "select",
          filters: [
            { field: "current_department_id", op: "eq", value: departmentId },
            { field: "is_active", op: "eq", value: true },
          ],
          orders: [{ field: "name", ascending: true }],
        }),
      });
      if (!res.ok) throw new Error("Failed to fetch nurses");
      const json = await res.json();
      setAvailableNurses(json.data || []);
    } catch (err) {
      console.error("Error fetching available nurses", err);
    }
  }, [departmentId, session]);

  const fetchSchedule = useCallback(async () => {
    if (!departmentId) return;
    setLoading(true);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
      const token = (session as any)?.access_token;
      const res = await fetch(`${API_BASE}/db/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          table: "schedules",
          action: "select",
          filters: [
            { field: "week_number", op: "eq", value: selectedWeek },
            { field: "year", op: "eq", value: selectedYear },
            { field: "department_id", op: "eq", value: departmentId },
          ],
          orders: [
            { field: "duty_date", ascending: true },
            { field: "shift_type", ascending: true },
          ],
        }),
      });
      if (!res.ok) throw new Error("Failed to fetch schedules");
      const json = await res.json();
      setScheduleData((json.data as ScheduleRow[]) || []);
    } catch (err) {
      console.error("Error fetching schedules:", err);
    }
    setLoading(false);
  }, [selectedWeek, selectedYear, departmentId, session]);

  useEffect(() => {
    fetchSchedule();
    fetchAvailableNurses();
  }, [fetchSchedule, fetchAvailableNurses]);

  const handleGenerate = async (forceAssignRemaining = false, confirmOverwrite = false) => {
    // Validate date constraints for head nurses
    const now = new Date();
    const currentWeek = getISOWeek(now);
    const currentYear = now.getFullYear();
    
    // Simple week distance calculation
    const weekDiff = (selectedYear - currentYear) * 52 + (selectedWeek - currentWeek);

    if (weekDiff < 0) {
      toast({ 
        title: "Invalid Week", 
        description: "Cannot generate schedules for past weeks.", 
        variant: "destructive" 
      });
      return;
    }

    if (weekDiff > 3) {
      toast({ 
        title: "Invalid Week", 
        description: "You can only generate schedules up to 4 weeks in advance (current week + 3 future weeks).", 
        variant: "destructive" 
      });
      return;
    }

    setGenerating(true);
    try {
      const token = (session as any)?.access_token;
      const apiBase = import.meta.env.VITE_API_BASE_URL || "/api";

      const response = await fetch(`${apiBase}/functions/generate-schedule`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          week_number: selectedWeek,
          year: selectedYear,
          force_assign_remaining: forceAssignRemaining,
          shift_pattern: shiftPattern,
          max_shifts_per_week: Math.round(maxHoursPerWeek / (shiftPattern === "12_hours" ? 12 : 8)),
          confirm_overwrite: confirmOverwrite,
          acuity_requirements: acuityTargets,
        }),
      });
      
      const result = await response.json();

      if (!response.ok) {
        if (response.status === 409 && result?.code === "SCHEDULE_ALREADY_EXISTS") {
          setOverwriteDialog({ open: true, message: result.error, prompt: result.prompt });
          setGenerating(false);
          return;
        }
        if ((result?.code === "INSUFFICIENT_NURSES" || result?.code === "INSUFFICIENT_ACUITY_RESOURCES") && result?.can_force_generate && !forceAssignRemaining) {
          setFallbackDialog({ open: true, message: result.error, prompt: result.prompt });
          setGenerating(false);
          return;
        }
        throw new Error(result?.error || "Unable to generate schedule");
      }

      toast({
        title: "Schedule Generated",
        description: result?.ai_used
          ? `Generated with Groq AI! Created ${result.stats.total_entries} shift entries.`
          : result?.fallback_used
          ? `Created ${result.stats.total_entries} entries using available nurses (fallback mode).`
          : `Created ${result.stats.total_entries} shift entries for ${result.stats.nurses_scheduled} nurses.`,
      });
      await fetchSchedule();
    } catch (error: any) {
      toast({ title: "Cannot Auto-Generate", description: error.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const handleEditSchedule = async () => {
    if (!editingSchedule || !selectedNurseId || !selectedShiftType) {
      toast({ title: "Error", description: "Please select a nurse and shift", variant: "destructive" });
      return;
    }

    setEditingLoading(true);
    try {
      const token = (session as any)?.access_token;
      const apiBase = import.meta.env.VITE_API_BASE_URL || "/api";
      const res = await fetch(`${apiBase}/functions/schedules/${editingSchedule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ nurse_id: selectedNurseId, shift_type: selectedShiftType }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to update schedule");
      }
      toast({ title: "Schedule Updated", description: "The schedule entry has been updated." });
      setEditingSchedule(null);
      setSelectedNurseId("");
      setSelectedShiftType("");
      await fetchSchedule();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || String(err), variant: "destructive" });
    } finally {
      setEditingLoading(false);
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    setDeletingId(scheduleId);
    try {
      const token = (session as any)?.access_token;
      const apiBase = import.meta.env.VITE_API_BASE_URL || "/api";
      const res = await fetch(`${apiBase}/functions/schedules/${scheduleId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to delete schedule");
      }
      toast({ title: "Schedule Removed", description: "The nurse has been removed from this shift." });
      await fetchSchedule();
    } catch (err: any) {
      toast({ title: "Error", description: err.message || String(err), variant: "destructive" });
    } finally {
      setDeletingId(null);
    }
  };

  const filtered = scheduleData.filter((s) => {
    const nurseName = s.nurse?.name?.toLowerCase() || "";
    const deptName = s.department?.name?.toLowerCase() || "";
    const q = search.toLowerCase();
    return nurseName.includes(q) || deptName.includes(q);
  });

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  };

  const toggleDay = (dateStr: string) => {
    const newExpanded = new Set(expandedDays);
    if (newExpanded.has(dateStr)) {
      newExpanded.delete(dateStr);
    } else {
      newExpanded.add(dateStr);
    }
    setExpandedDays(newExpanded);
  };

  const groupByDate = (data: ScheduleRow[]) => {
    const grouped: { [key: string]: ScheduleRow[] } = {};
    data.forEach((item) => {
      if (!grouped[item.duty_date]) {
        grouped[item.duty_date] = [];
      }
      grouped[item.duty_date].push(item);
    });
    return Object.entries(grouped).sort(([dateA], [dateB]) => dateA.localeCompare(dateB));
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Weekly Schedule</h2>
          {selectedYear < now.getFullYear() || selectedYear > now.getFullYear() + 1 ? (
            <p className="text-xs text-destructive mt-0.5">⚠️ You can only view or generate schedules for {now.getFullYear()} or {now.getFullYear() + 1}</p>
          ) : !departmentId && !loading ? (
            <p className="text-xs text-destructive mt-0.5">⚠️ Head Nurse profile not loaded. Department data is missing.</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1">
            <Label className="text-xs text-muted-foreground">Week:</Label>
            <Input type="number" min={1} max={53} value={selectedWeek} onChange={(e) => setSelectedWeek(Number(e.target.value))} className="w-16 h-9" />
            <Label className="text-xs text-muted-foreground ml-1">Year:</Label>
            <Input type="number" min={now.getFullYear()} max={now.getFullYear() + 1} value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="w-20 h-9" />
          </div>
          <div className="flex items-center gap-1">
            <Label className="text-xs text-muted-foreground">Pattern:</Label>
            <select 
              className="h-9 rounded-md border bg-background px-2 text-sm" 
              value={shiftPattern} 
              onChange={e => {
                const newPattern = e.target.value;
                setShiftPattern(newPattern);
                setMaxHoursPerWeek(newPattern === "12_hours" ? 36 : 40);
              }}
            >
              <option value="12_hours">12-Hour</option>
              <option value="8_hours">8-Hour (3/day)</option>
            </select>
          </div>
          <div className="flex items-center gap-1">
            <Label className="text-xs text-muted-foreground" title="Target work hours per week for each nurse">Max Hours/Wk:</Label>
            <Input type="number" min={8} max={84} step={shiftPattern === "12_hours" ? 12 : 8} value={maxHoursPerWeek} onChange={(e) => setMaxHoursPerWeek(Number(e.target.value))} className="w-16 h-9" />
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search..." className="pl-10 w-32 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className={showAcuityPanel ? "bg-primary/10 text-primary border-primary/20" : ""}
            onClick={() => setShowAcuityPanel(!showAcuityPanel)}
          >
            <Settings2 size={16} className="mr-1" />
            Acuity Targets
          </Button>
          <Button variant="pink" size="sm" onClick={() => handleGenerate(false)} disabled={generating}>
            {generating ? <Loader2 size={16} className="mr-1 animate-spin" /> : <Wand2 size={16} className="mr-1" />}
            {generating ? "Generating..." : "Auto-Generate"}
          </Button>
        </div>
      </div>

      {showAcuityPanel && (
        <div className="bg-muted/30 rounded-xl p-4 border border-border animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Zap size={16} className="text-amber-500" />
              Staffing Targets per Shift
            </h3>
            <p className="text-xs text-muted-foreground">Specify how many nurses of each acuity level you need per shift.</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {divisions.sort((a, b) => (a.acuity_level || 0) - (b.acuity_level || 0)).map((div) => (
              <div key={div._id} className="space-y-1.5">
                <Label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {div.name}
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={10}
                  value={acuityTargets[div._id] || ""}
                  placeholder="0"
                  onChange={(e) => setAcuityTargets({ ...acuityTargets, [div._id]: parseInt(e.target.value) || 0 })}
                  className="h-8 text-sm"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl bg-card p-12 text-center shadow-card">
          <Calendar className="mx-auto h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 text-sm font-medium text-foreground">No schedule for Week {selectedWeek}, {selectedYear}</p>
          <p className="mt-1 text-xs text-muted-foreground">Click "Auto-Generate" to create a fair schedule automatically.</p>
        </div>
      ) : (
        <div className="space-y-3 rounded-xl bg-card shadow-card overflow-hidden">
          {groupByDate(filtered).map(([dateStr, dayShifts]) => (
            <div key={dateStr} className="border-b last:border-b-0">
              <button
                onClick={() => toggleDay(dateStr)}
                className="w-full px-4 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <ChevronDown
                    size={18}
                    className={`text-primary transition-transform ${expandedDays.has(dateStr) ? "rotate-180" : ""}`}
                  />
                  <div className="text-left">
                    <p className="font-semibold text-foreground">{formatDate(dateStr)}</p>
                    <p className="text-xs text-muted-foreground">{dayShifts.length} shift{dayShifts.length !== 1 ? "s" : ""}</p>
                  </div>
                </div>
                <Badge variant="secondary" className="ml-auto">
                  {dayShifts.length}
                </Badge>
              </button>

              {expandedDays.has(dateStr) && (
                <div className="border-t bg-muted/10 divide-y">
                  {dayShifts.map((s) => (
                    <div key={s.id} className="px-4 py-3 flex items-center justify-between hover:bg-muted/20 transition-colors">
                      <div className="flex-1">
                        <p className="font-medium text-foreground text-sm">{s.nurse?.name || "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{s.department?.name || "Unknown"}</p>
                      </div>
                      <Badge
                        className={
                          s.shift_type === "day"
                            ? "bg-amber-100 text-amber-700 border-0"
                            : s.shift_type === "night"
                            ? "bg-indigo-100 text-indigo-700 border-0"
                            : s.shift_type === "morning"
                            ? "bg-primary/10 text-primary border-0"
                            : s.shift_type === "evening"
                            ? "bg-accent/20 text-accent border-0"
                            : "bg-muted text-foreground border-0"
                        }
                      >
                        {SHIFT_LABELS[s.shift_type] || s.shift_type}
                      </Badge>
                      <div className="ml-4 flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-primary"
                          onClick={() => {
                            setEditingSchedule(s);
                            setSelectedNurseId(s.nurse?.id || "");
                            setSelectedShiftType(s.shift_type);
                          }}
                        >
                          <Edit3 size={14} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => handleDeleteSchedule(s.id)}
                          disabled={deletingId === s.id}
                        >
                          {deletingId === s.id ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
          <div className="border-t px-4 py-3 text-xs text-muted-foreground bg-muted/10">
            {filtered.length} entries • {new Set(filtered.map((s) => s.nurse?.id)).size} nurses
          </div>
        </div>
      )}

      {/* Fallback Dialog for Auto-Generate */}
      <Dialog open={fallbackDialog.open} onOpenChange={(open) => !open && setFallbackDialog({ open: false, message: "", prompt: "" })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-5 w-5 text-primary" />
              Schedule Generation
            </DialogTitle>
            <DialogDescription>
              Adjust settings and finalize the duty roster for your department.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-foreground/80">{fallbackDialog.message}</p>
            <p className="text-sm font-medium text-foreground">{fallbackDialog.prompt}</p>
          </div>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setFallbackDialog({ open: false, message: "", prompt: "" })}>
              Cancel
            </Button>
            <Button variant="pink" onClick={() => {
              setFallbackDialog({ open: false, message: "", prompt: "" });
              handleGenerate(true);
            }}>
              Generate Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Overwrite Confirmation Dialog */}
      <Dialog open={overwriteDialog.open} onOpenChange={(open) => !open && setOverwriteDialog({ open: false, message: "", prompt: "" })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Schedule Already Exists
            </DialogTitle>
            <DialogDescription>
              {overwriteDialog.message}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm font-medium text-foreground">{overwriteDialog.prompt}</p>
          </div>
          <DialogFooter className="flex gap-2 sm:justify-end">
            <Button variant="outline" onClick={() => setOverwriteDialog({ open: false, message: "", prompt: "" })}>
              Cancel
            </Button>
            <Button variant="pink" onClick={() => {
              setOverwriteDialog({ open: false, message: "", prompt: "" });
              handleGenerate(false, true);
            }}>
              Yes, Overwrite
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Shift Dialog */}
      <Dialog open={!!editingSchedule} onOpenChange={(open) => !open && setEditingSchedule(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Shift</DialogTitle>
            <DialogDescription>
              Change the assigned nurse or shift type for this duty.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Nurse</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedNurseId}
                onChange={(e) => setSelectedNurseId(e.target.value)}
              >
                <option value="">Select a nurse</option>
                {availableNurses.map((n) => (
                  <option key={n.id} value={n.id}>{n.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Shift Type</Label>
              <select
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedShiftType}
                onChange={(e) => setSelectedShiftType(e.target.value)}
              >
                <option value="day">Day Shift (6AM - 6PM)</option>
                <option value="night">Night Shift (6PM - 6AM)</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingSchedule(null)}>Cancel</Button>
            <Button onClick={handleEditSchedule} disabled={editingLoading}>
              {editingLoading && <Loader2 size={16} className="mr-2 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
};

// --- Swap View --------------------------------------------------

const HNSwapView = () => {
  const [swaps, setSwaps] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { session } = useAuth();

  useEffect(() => {
    const fetchSwaps = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
        const token = (session as any)?.access_token;
        const res = await fetch(`${API_BASE}/db/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({
            table: "shift_swap_requests",
            action: "select",
            filters: [{ field: "status", op: "in", value: ["pending_admin", "pending"] }],
            orders: [{ field: "created_at", ascending: false }],
          }),
        });
        if (!res.ok) throw new Error("Failed to fetch swaps");
        const json = await res.json();
        setSwaps(json.data || []);
      } catch (err) {
        console.error("Error fetching swaps", err);
      }
      setLoading(false);
    };
    fetchSwaps();
  }, [session]);

  const handleAction = async (id: string, status: "approved" | "rejected") => {
    try {
      const token = (session as any)?.access_token;
      const apiBase = import.meta.env.VITE_API_BASE_URL || "/api";
      const res = await fetch(`${apiBase}/functions/handle-swap`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ swap_id: id, action: status }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed");
      toast({ title: `Swap ${status}` });
      setSwaps((prev) => prev.filter((s) => s.id !== id));
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-lg font-bold text-foreground">Pending Swap Requests</h2>
      <p className="text-xs text-muted-foreground -mt-2">Swaps are only permitted between nurses of the same Acuity level.</p>
      {swaps.length === 0 ? (
        <div className="rounded-xl bg-card p-12 text-center shadow-card">
          <ArrowLeftRight className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <p className="mt-4 text-sm text-muted-foreground">No pending swap requests</p>
        </div>
      ) : (
        swaps.map((r) => (
          <div key={r.id} className="rounded-xl bg-card p-5 shadow-card">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-2">
                <p className="text-sm font-bold text-foreground">
                  {r.requester?.name || "Unknown"} {" <-> "} {r.target?.name || "Unknown"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {r.requester_schedule?.shift_type} - {r.requester_schedule?.department?.name} {" -> "}
                  {r.target_schedule?.shift_type} - {r.target_schedule?.department?.name}
                </p>
                <p className="text-xs text-muted-foreground">
                  Date: {r.requester_schedule?.duty_date}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="hero" size="sm" onClick={() => handleAction(r.id, "approved")}>
                  <Check size={14} className="mr-1" /> Approve
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleAction(r.id, "rejected")}>
                  <XCircle size={14} className="mr-1" /> Reject
                </Button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

// --- Performance View -------------------------------------------

const HNPerformanceView = () => {
  const { user, session } = useAuth();
  const [nurses, setNurses] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  
  // Evaluation Modal State
  const [selectedNurse, setSelectedNurse] = useState<any>(null);
  const [attendance, setAttendance] = useState("");
  const [quality, setQuality] = useState("");
  const [reliability, setReliability] = useState("");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
        const token = (session as any)?.access_token;

        // 1. Get head nurse dept
        const hnRes = await fetch(`${API_BASE}/db/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ table: "head_nurses", action: "select", filters: [{ field: "user_id", op: "eq", value: user.id }], options: { maybeSingle: true } }),
        });
        if (!hnRes.ok) {
          setLoading(false);
          return;
        }
        const hnJson = await hnRes.json();
        const deptId = hnJson.data?.department_id;
        if (!deptId) {
          setLoading(false);
          return;
        }

        // 2. Fetch scoped nurses and evals
        const [nursesRes, evalsRes] = await Promise.all([
          fetch(`${API_BASE}/db/query`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ table: "nurses", action: "select", filters: [{ field: "is_active", op: "eq", value: true }, { field: "current_department_id", op: "eq", value: deptId }], options: { }, }),
          }),
          fetch(`${API_BASE}/db/query`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ table: "performance_evaluations", action: "select", orders: [{ field: "created_at", ascending: false }] }),
          }),
        ]);

        const nursesJson = await nursesRes.json();
        const evalsJson = await evalsRes.json();

        if (nursesRes.ok) setNurses(nursesJson.data || []);

        // Group evaluations by nurse_id, keep latest
        const evalMap: Record<string, any> = {};
        if (evalsRes.ok && evalsJson.data) {
          for (const ev of evalsJson.data) {
            if (!evalMap[ev.nurse_id]) {
              evalMap[ev.nurse_id] = ev;
            }
          }
        }
        setEvaluations(evalMap);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching performance data", err);
        setLoading(false);
      }
    };
    fetchData();
  }, [user, session]);

  const handleOpenEvaluation = (nurse: any) => {
    setSelectedNurse(nurse);
    const ev = evaluations[nurse.id];
    setAttendance(ev?.attendance_score || "");
    setQuality(ev?.quality_score || "");
    setReliability(ev?.reliability_score || "");
    setRemarks(ev?.remarks || "");
  };

  const handleSaveEvaluation = async () => {
    if (!selectedNurse || !user) return;
    setSaving(true);
    
    if (attendance === "" || quality === "" || reliability === "") {
      toast({ title: "Validation Error", description: "Please fill in all score fields.", variant: "destructive" });
      setSaving(false);
      return;
    }

    const att = Number(attendance);
    const qual = Number(quality);
    const rel = Number(reliability);

    if (att < 0 || att > 100 || qual < 0 || qual > 100 || rel < 0 || rel > 100) {
      toast({ title: "Validation Error", description: "Scores must be between 0 and 100.", variant: "destructive" });
      setSaving(false);
      return;
    }

    const overall = Math.round((att + qual + rel) / 3);

    const payload = {
      nurse_id: selectedNurse.id,
      evaluated_by: user.id,
      attendance_score: att,
      quality_score: qual,
      reliability_score: rel,
      overall_score: overall,
      remarks,
      evaluation_period: new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" })
    };

    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
      const token = (session as any)?.access_token;
      const res = await fetch(`${API_BASE}/db/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ table: "performance_evaluations", action: "insert", payload }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to save evaluation");
      }
      toast({ title: "Evaluation Saved", description: `Updated performance for ${selectedNurse.name}` });
      setEvaluations(prev => ({ ...prev, [selectedNurse.id]: payload }));
      setSelectedNurse(null);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <h2 className="text-lg font-bold text-foreground">Nurse Performance</h2>
      {nurses.length === 0 ? (
        <div className="rounded-xl bg-card p-12 text-center shadow-card">
          <Users className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <p className="mt-4 text-sm text-muted-foreground">No active nurses found</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {nurses.map((n) => {
            const ev = evaluations[n.id];
            const score = ev?.overall_score ? Number(ev.overall_score) : null;
            const attendanceScore = ev?.attendance_score ? Number(ev.attendance_score) : null;
            const qualityScore = ev?.quality_score ? Number(ev.quality_score) : null;
            const reliabilityScore = ev?.reliability_score ? Number(ev.reliability_score) : null;

            return (
              <div 
                key={n.id} 
                className="rounded-xl bg-card p-5 shadow-card cursor-pointer hover:border-primary/50 transition-colors border-2 border-transparent"
                onClick={() => handleOpenEvaluation(n)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        {n.photo_url ? (
                          <AvatarImage src={n.photo_url} alt={n.name} className="object-cover" />
                        ) : null}
                        <AvatarFallback className="bg-primary/10 text-sm font-bold text-primary">
                          {n.name.split(" ").map((w: string) => w[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                    <div>
                      <p className="text-sm font-bold text-foreground">{n.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {n.divisions?.name
                          ? <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${ACUITY_COLORS[n.divisions.name] || "bg-muted text-muted-foreground"}`}>{n.divisions.name}</span>
                          : "No Acuity"}
                        {" "}{n.departments?.name || "Unassigned"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 text-accent" fill="currentColor" />
                    <span className="text-sm font-bold text-foreground">{score !== null ? `${score}%` : "N/A"}</span>
                  </div>
                </div>
                {score !== null ? (
                  <>
                    <div className="mt-3 h-2 rounded-full bg-muted">
                      <div className="h-2 rounded-full bg-primary" style={{ width: `${score}%` }} />
                    </div>
                    <div className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-muted-foreground">
                      <span>Attendance: {attendanceScore ?? "-"}%</span>
                      <span>Quality: {qualityScore ?? "-"}%</span>
                      <span>Reliability: {reliabilityScore ?? "-"}%</span>
                    </div>
                    {ev?.remarks && (
                      <p className="mt-2 text-xs text-muted-foreground italic truncate">"{ev.remarks}"</p>
                    )}
                  </>
                ) : (
                  <p className="mt-3 text-xs text-muted-foreground">No evaluation recorded yet</p>
                )}
                <div className="mt-2 text-xs text-muted-foreground">
                  Experience: {n.experience_years || 0} yrs
                  {ev?.evaluation_period && <span> • Period: {ev.evaluation_period}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Evaluation Modal */}
      <Dialog open={!!selectedNurse} onOpenChange={(open) => !open && setSelectedNurse(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Evaluate {selectedNurse?.name}</DialogTitle>
            <DialogDescription>
              Record attendance, quality, and reliability metrics for this nurse.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Attendance Score (0-100)</Label>
              <Input type="number" min="0" max="100" value={attendance} onChange={e => setAttendance(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Quality Score (0-100)</Label>
              <Input type="number" min="0" max="100" value={quality} onChange={e => setQuality(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Reliability Score (0-100)</Label>
              <Input type="number" min="0" max="100" value={reliability} onChange={e => setReliability(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Remarks</Label>
              <Textarea placeholder="Any qualitative feedback..." value={remarks} onChange={e => setRemarks(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedNurse(null)}>Cancel</Button>
            <Button onClick={handleSaveEvaluation} disabled={saving}>
              {saving ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
              Save Evaluation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// --- Manage Nurses View -----------------------------------------

const HNManageView = () => {
  const { user, session } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [nurses, setNurses] = useState<any[]>([]);
  const [acuityLevels, setAcuityLevels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [assigningAcuity, setAssigningAcuity] = useState<Record<string, boolean>>({});
  const [nurseToRemove, setNurseToRemove] = useState<any>(null);
  const [removingNurse, setRemovingNurse] = useState(false);

  // The head nurse's own department (resolved once on mount)
  const [myDeptId, setMyDeptId] = useState<string | null>(null);
  const [myDeptName, setMyDeptName] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAge, setNewAge] = useState("");
  const [newGender, setNewGender] = useState("");
  const [newDivisionId, setNewDivisionId] = useState("");
  const [newExperience, setNewExperience] = useState("");
  const [newExamScore, setNewExamScore] = useState("");

  // Step 1 - resolve HN's department, then step 2 - fetch scoped nurses
  const fetchData = useCallback(async (deptId: string) => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
      const token = (session as any)?.access_token;

      const [nursesRes, divsRes] = await Promise.all([
        fetch(`${API_BASE}/db/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ table: "nurses", action: "select", filters: [{ field: "is_active", op: "eq", value: true }, { field: "current_department_id", op: "eq", value: deptId }], options: {} }),
        }),
        fetch(`${API_BASE}/db/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ table: "divisions", action: "select", orders: [{ field: "acuity_level", ascending: true }] }),
        }),
      ]);

      const nursesJson = await nursesRes.json();
      const divsJson = await divsRes.json();

      if (nursesRes.ok) setNurses(nursesJson.data || []);
      if (divsRes.ok) setAcuityLevels(divsJson.data || []);
      setLoading(false);
    } catch (err) {
      console.error("Error fetching manage view data", err);
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      try {
        const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
        const token = (session as any)?.access_token;
        const res = await fetch(`${API_BASE}/db/query`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify({ table: "head_nurses", action: "select", filters: [{ field: "user_id", op: "eq", value: user.id }], options: { maybeSingle: true } }),
        });
        if (!res.ok) {
          setLoading(false);
          return;
        }
        const json = await res.json();
        const deptId = json.data?.department_id ?? null;
        const deptName = json.data?.departments?.name ?? null;
        setMyDeptId(deptId);
        setMyDeptName(deptName);

        if (deptId) {
          await fetchData(deptId);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Error initializing manage view", err);
        setLoading(false);
      }
    };
    init();
  }, [user, fetchData, session]);

  const handleAddNurse = async () => {
    // 1. Basic presence validation
    if (!newName.trim() || !newPhone.trim()) {
      toast({ title: "Validation Error", description: "Name and phone number are required.", variant: "destructive" });
      return;
    }

    // 2. Phone validation (Assuming 10 digits)
    const phoneDigits = newPhone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      toast({ title: "Invalid Phone", description: "Please enter a valid 10-digit phone number.", variant: "destructive" });
      return;
    }

    // 3. Age validation
    if (newAge) {
      const ageVal = parseInt(newAge);
      if (isNaN(ageVal) || ageVal < 18 || ageVal > 75) {
        toast({ title: "Invalid Age", description: "Age must be between 18 and 75.", variant: "destructive" });
        return;
      }
    }

    // 4. Experience validation
    if (newExperience) {
      const expVal = parseInt(newExperience);
      if (isNaN(expVal) || expVal < 0 || expVal > 50) {
        toast({ title: "Invalid Experience", description: "Experience must be between 0 and 50 years.", variant: "destructive" });
        return;
      }
    }

    // 5. Exam Score validation
    if (newExamScore) {
      const scoreVal = parseFloat(newExamScore);
      if (isNaN(scoreVal) || scoreVal < 0 || scoreVal > 100) {
        toast({ title: "Invalid Score", description: "Exam score must be between 0 and 100%.", variant: "destructive" });
        return;
      }
    }

    if (!myDeptId) {
      toast({ title: "Configuration Error", description: "You have no department assigned yet.", variant: "destructive" });
      return;
    }

    setSaving(true);
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
      const token = (session as any)?.access_token;
      const res = await fetch(`${API_BASE}/db/query`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          table: "nurses",
          action: "insert",
          payload: {
            name: newName.trim(),
            phone: phoneDigits,
            age: newAge ? parseInt(newAge) : null,
            gender: newGender as any || null,
            division_id: newDivisionId || null,
            current_department_id: myDeptId,
            experience_years: newExperience ? parseInt(newExperience) : 0,
            exam_score_percentage: newExamScore ? parseFloat(newExamScore) : null,
          }
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Failed to add nurse");
      }
      toast({ title: "Nurse Added", description: `${newName} has been added to ${myDeptName || "your department"}.` });
      setNewName(""); setNewPhone(""); setNewAge(""); setNewGender(""); setNewDivisionId(""); setNewExperience(""); setNewExamScore("");
      setShowAdd(false);
      if (myDeptId) await fetchData(myDeptId);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleAssignAcuity = async (nurseId: string, divisionId: string) => {
    setAssigningAcuity((prev) => ({ ...prev, [nurseId]: true }));
    try {
      const token = (session as any)?.access_token;
      const apiBase = import.meta.env.VITE_API_BASE_URL || "/api";

      const res = await fetch(`${apiBase}/functions/nurses/${nurseId}/acuity`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ division_id: divisionId || null }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to update acuity");

      // Update local state with the server's confirmed value
      setNurses((prev) => prev.map((n) => (n.id !== nurseId ? n : { ...n, division_id: json.division_id, divisions: json.divisions })));
      toast({ title: "Acuity Assigned", description: "Nurse acuity level updated." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setAssigningAcuity((prev) => ({ ...prev, [nurseId]: false }));
    }
  };


  const handleRemove = async () => {
    if (!nurseToRemove) return;
    setRemovingNurse(true);
    const token = (session as any)?.access_token;
    const apiBase = import.meta.env.VITE_API_BASE_URL || "/api";

    try {
      const updateRes = await fetch(`${apiBase}/functions/nurses/${nurseToRemove.id}/deactivate`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      });

      if (!updateRes.ok) {
        const errJson = await updateRes.json().catch(() => ({}));
        throw new Error(errJson.error || "Failed to remove nurse");
      }

      toast({ title: "Nurse Removed", description: `${nurseToRemove.name} has been permanently removed from the database.` });
      setNurseToRemove(null);
      if (myDeptId) fetchData(myDeptId);
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setRemovingNurse(false);
    }
  };

  const filtered = nurses.filter((n) => {
    const q = search.toLowerCase();
    return n.name.toLowerCase().includes(q) || n.phone.includes(q);
  });

  if (loading) {
    return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  if (!myDeptId) {
    return (
      <div className="rounded-xl bg-card p-14 text-center shadow-card">
        <Users className="mx-auto h-10 w-10 text-muted-foreground/30" />
        <p className="mt-4 text-sm font-medium text-foreground">No Department Assigned</p>
        <p className="text-xs text-muted-foreground">Ask an Admin to assign you a department before managing nurses.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-foreground">Manage Nurses</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{myDeptName} Â· {nurses.length} active nurses</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Search nurses..." className="pl-10 w-48 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Button variant="pink" size="sm" onClick={() => setShowAdd(!showAdd)}>
            <UserPlus size={16} className="mr-1" /> Add Nurse
          </Button>
        </div>
      </div>

      {showAdd && (
        <div className="rounded-xl bg-card p-6 shadow-card">
          <h3 className="text-sm font-bold text-foreground mb-4">Add New Nurse</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2"><Label>Full Name</Label><Input placeholder="Enter name" value={newName} onChange={(e) => setNewName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Phone Number</Label><Input placeholder="Enter phone" value={newPhone} onChange={(e) => setNewPhone(e.target.value)} /></div>
            <div className="space-y-2"><Label>Age</Label><Input type="number" placeholder="Age" value={newAge} onChange={(e) => setNewAge(e.target.value)} /></div>
            <div className="space-y-2">
              <Label>Gender</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newGender} onChange={(e) => setNewGender(e.target.value)}>
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Acuity Level</Label>
              <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newDivisionId} onChange={(e) => setNewDivisionId(e.target.value)}>
                <option value="">Select acuity level</option>
                {acuityLevels.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label>Department</Label>
              <Input value={myDeptName || ""} readOnly disabled className="bg-muted text-muted-foreground cursor-not-allowed" />
            </div>
            <div className="space-y-2"><Label>Experience (years)</Label><Input type="number" placeholder="0" value={newExperience} onChange={(e) => setNewExperience(e.target.value)} /></div>
            <div className="space-y-2"><Label>Exam Score (%)</Label><Input type="number" placeholder="0-100" value={newExamScore} onChange={(e) => setNewExamScore(e.target.value)} /></div>
          </div>
          <div className="mt-4 flex gap-2">
            <Button variant="hero" onClick={handleAddNurse} disabled={saving}>
              {saving && <Loader2 size={16} className="mr-1 animate-spin" />}
              Save Nurse
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowAdd(false);
                setNewName(""); setNewPhone(""); setNewAge(""); setNewGender("");
                setNewDivisionId(""); setNewExperience(""); setNewExamScore("");
              }}
              disabled={saving}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-xl bg-card p-12 text-center shadow-card">
          <Users className="mx-auto h-10 w-10 text-muted-foreground/30" />
          <p className="mt-4 text-sm text-muted-foreground">{search ? "No nurses match your search." : "No active nurses. Add a nurse above to get started."}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl bg-card shadow-card">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-semibold text-foreground">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Acuity Level</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Department</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Phone</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Exp</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((n) => (
                <tr key={n.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium text-foreground">{n.name}</td>
                  <td className="px-4 py-3">
                    <select
                      value={n.division_id || ""}
                      onChange={(e) => handleAssignAcuity(n.id, e.target.value)}
                      disabled={assigningAcuity[n.id]}
                      className={`h-8 rounded-md border border-input bg-background px-2 text-xs font-medium ${
                        n.divisions?.name ? (ACUITY_COLORS[n.divisions.name] || "") : "text-muted-foreground"
                      }`}
                    >
                      <option value="">No Acuity</option>
                      {acuityLevels.map((a) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{n.departments?.name || "-"}</td>
                  <td className="px-4 py-3 text-muted-foreground">{n.phone}</td>
                  <td className="px-4 py-3 text-muted-foreground">{n.experience_years || 0} yrs</td>
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => setNurseToRemove(n)}>
                      <Trash2 size={14} />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t px-4 py-3 text-xs text-muted-foreground">
            {filtered.length} active nurses
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!nurseToRemove} onOpenChange={(open) => !open && setNurseToRemove(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Remove Nurse
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <span className="font-bold text-foreground">{nurseToRemove?.name}</span>? 
              This action is <span className="font-bold text-destructive underline">permanent</span> and will delete the nurse and their account from the database.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2 sm:justify-end mt-4">
            <Button variant="outline" onClick={() => setNurseToRemove(null)} disabled={removingNurse}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemove} disabled={removingNurse}>
              {removingNurse ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Trash2 size={16} className="mr-2" />}
              Permanently Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HeadNurseDashboard;
