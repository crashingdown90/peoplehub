"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MapPin,
  Building2,
  Users,
  Edit,
  RefreshCw,
  ExternalLink,
  Navigation,
  Save,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { fetchWithCsrf } from "@/lib/api-client";

interface Branch {
  id: string;
  code: string;
  name: string;
  address: string | null;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  geofenceRadiusMeters: number | null;
  isActive: boolean;
  employeeCount: number;
}

interface EditForm {
  latitude: string;
  longitude: string;
  geofenceRadiusMeters: string;
  address: string;
}

export default function BranchLocationsPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [editBranch, setEditBranch] = useState<Branch | null>(null);
  const [editForm, setEditForm] = useState<EditForm>({
    latitude: "",
    longitude: "",
    geofenceRadiusMeters: "100",
    address: "",
  });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const fetchBranches = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/superadmin/branches");
      const data = await res.json();
      if (data.success) {
        setBranches(data.data);
      } else {
        toast({ title: "Error", description: data.error?.message || "Failed to load branches", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Failed to load branches", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchBranches();
  }, [fetchBranches]);

  const openEditDialog = (branch: Branch) => {
    setEditBranch(branch);
    setEditForm({
      latitude: branch.latitude?.toString() || "",
      longitude: branch.longitude?.toString() || "",
      geofenceRadiusMeters: branch.geofenceRadiusMeters?.toString() || "100",
      address: branch.address || "",
    });
  };

  const handleSave = async () => {
    if (!editBranch) return;

    const lat = parseFloat(editForm.latitude);
    const lng = parseFloat(editForm.longitude);
    const radius = parseInt(editForm.geofenceRadiusMeters);

    if (isNaN(lat) || lat < -90 || lat > 90) {
      toast({ title: "Error", description: "Latitude harus antara -90 dan 90", variant: "destructive" });
      return;
    }
    if (isNaN(lng) || lng < -180 || lng > 180) {
      toast({ title: "Error", description: "Longitude harus antara -180 dan 180", variant: "destructive" });
      return;
    }
    if (isNaN(radius) || radius < 10 || radius > 10000) {
      toast({ title: "Error", description: "Radius harus antara 10 dan 10000 meter", variant: "destructive" });
      return;
    }

    try {
      setSaving(true);
      const res = await fetchWithCsrf("/api/admin/superadmin/branches", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          branchId: editBranch.id,
          latitude: lat,
          longitude: lng,
          geofenceRadiusMeters: radius,
          address: editForm.address || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Berhasil", description: "Lokasi branch berhasil diperbarui" });
        setEditBranch(null);
        fetchBranches();
      } else {
        toast({ title: "Error", description: data.error?.message || "Gagal menyimpan", variant: "destructive" });
      }
    } catch {
      toast({ title: "Error", description: "Gagal menyimpan lokasi", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "Error", description: "Geolocation tidak didukung browser ini", variant: "destructive" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setEditForm(prev => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        toast({ title: "Berhasil", description: "Lokasi saat ini berhasil diambil" });
      },
      () => {
        toast({ title: "Error", description: "Gagal mendapatkan lokasi", variant: "destructive" });
      }
    );
  };

  const openGoogleMaps = (lat: number | null, lng: number | null) => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text)]">Lokasi Kehadiran</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Atur lokasi kantor dan radius geofence untuk validasi absensi
          </p>
        </div>
        <Button variant="outline" onClick={fetchBranches} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p className="font-medium mb-1">Cara mengatur lokasi:</p>
              <ol className="list-decimal list-inside space-y-1 text-blue-700 dark:text-blue-300">
                <li>Buka Google Maps dan cari lokasi kantor</li>
                <li>Klik kanan pada titik lokasi, lalu copy koordinatnya</li>
                <li>Masukkan latitude dan longitude ke form edit</li>
                <li>Atur radius geofence (disarankan minimal 100 meter)</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Branch List */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {branches.map((branch) => (
            <Card key={branch.id} className={!branch.isActive ? "opacity-60" : ""}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Building2 className="h-5 w-5 text-[var(--color-primary)]" />
                      {branch.name}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Badge variant="outline">{branch.code}</Badge>
                      {!branch.isActive && <Badge variant="secondary">Nonaktif</Badge>}
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => openEditDialog(branch)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
                  <Users className="h-4 w-4" />
                  <span>{branch.employeeCount} karyawan</span>
                </div>

                {branch.address && (
                  <div className="text-sm text-[var(--color-text-secondary)]">
                    {branch.address}
                    {branch.city && `, ${branch.city}`}
                  </div>
                )}

                <div className="pt-2 border-t">
                  {branch.latitude && branch.longitude ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-green-600" />
                          <span className="text-green-600 font-medium">Lokasi sudah diatur</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openGoogleMaps(branch.latitude, branch.longitude)}
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-xs text-[var(--color-text-secondary)] font-mono">
                        {branch.latitude?.toFixed(6)}, {branch.longitude?.toFixed(6)}
                      </div>
                      <div className="text-xs text-[var(--color-text-secondary)]">
                        Radius: {branch.geofenceRadiusMeters || 100}m
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-sm text-amber-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>Lokasi belum diatur</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editBranch} onOpenChange={() => setEditBranch(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Edit Lokasi: {editBranch?.name}
            </DialogTitle>
            <DialogDescription>
              Atur koordinat lokasi kantor untuk validasi geofence saat absensi
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={getCurrentLocation}>
                <Navigation className="h-4 w-4 mr-2" />
                Gunakan Lokasi Saat Ini
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open("https://www.google.com/maps", "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="latitude">Latitude</Label>
                <Input
                  id="latitude"
                  type="number"
                  step="any"
                  placeholder="-6.123456"
                  value={editForm.latitude}
                  onChange={(e) => setEditForm(prev => ({ ...prev, latitude: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="longitude">Longitude</Label>
                <Input
                  id="longitude"
                  type="number"
                  step="any"
                  placeholder="106.123456"
                  value={editForm.longitude}
                  onChange={(e) => setEditForm(prev => ({ ...prev, longitude: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="radius">Radius Geofence (meter)</Label>
              <Input
                id="radius"
                type="number"
                min="10"
                max="10000"
                placeholder="100"
                value={editForm.geofenceRadiusMeters}
                onChange={(e) => setEditForm(prev => ({ ...prev, geofenceRadiusMeters: e.target.value }))}
              />
              <p className="text-xs text-[var(--color-text-secondary)]">
                Jarak maksimal dari titik lokasi yang diizinkan untuk absensi (10-10000m)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Alamat (opsional)</Label>
              <Input
                id="address"
                placeholder="Jl. Contoh No. 123"
                value={editForm.address}
                onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditBranch(null)}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
