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
  Map,
  Crosshair,
  Ruler,
  MapPinned,
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
  const [gettingLocation, setGettingLocation] = useState(false);
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
    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setEditForm(prev => ({
          ...prev,
          latitude: position.coords.latitude.toFixed(6),
          longitude: position.coords.longitude.toFixed(6),
        }));
        toast({ title: "Berhasil", description: "Lokasi saat ini berhasil diambil" });
        setGettingLocation(false);
      },
      () => {
        toast({ title: "Error", description: "Gagal mendapatkan lokasi", variant: "destructive" });
        setGettingLocation(false);
      }
    );
  };

  const openGoogleMaps = (lat: number | null, lng: number | null) => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, "_blank");
    }
  };

  const hasValidCoordinates = editForm.latitude && editForm.longitude &&
    !isNaN(parseFloat(editForm.latitude)) && !isNaN(parseFloat(editForm.longitude));

  const getStaticMapUrl = (lat: string, lng: string) => {
    return `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=16&size=400x200&markers=color:red%7C${lat},${lng}&key=`;
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

      {/* Edit Dialog - Improved UI */}
      <Dialog open={!!editBranch} onOpenChange={() => setEditBranch(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <MapPinned className="h-6 w-6 text-[var(--color-primary)]" />
              Edit Lokasi Kantor
            </DialogTitle>
            <DialogDescription>
              <span className="font-semibold text-[var(--color-text)]">{editBranch?.name}</span> — Atur koordinat lokasi untuk validasi geofence saat absensi
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Map Preview */}
            <div className="rounded-lg border bg-[var(--color-bg-secondary)] overflow-hidden">
              {hasValidCoordinates ? (
                <div className="relative">
                  <div className="h-40 bg-gradient-to-br from-green-100 to-blue-100 dark:from-green-900/20 dark:to-blue-900/20 flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="h-10 w-10 text-red-500 mx-auto mb-2" />
                      <p className="text-sm font-mono text-[var(--color-text-secondary)]">
                        {editForm.latitude}, {editForm.longitude}
                      </p>
                      <Button
                        variant="link"
                        size="sm"
                        className="mt-1"
                        onClick={() => openGoogleMaps(parseFloat(editForm.latitude), parseFloat(editForm.longitude))}
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Lihat di Google Maps
                      </Button>
                    </div>
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300">
                      <MapPin className="h-3 w-3 mr-1" />
                      Koordinat Valid
                    </Badge>
                  </div>
                </div>
              ) : (
                <div className="h-40 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                  <div className="text-center text-[var(--color-text-secondary)]">
                    <Map className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Masukkan koordinat untuk melihat preview</p>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant="outline"
                className="h-auto py-3 flex-col gap-1"
                onClick={getCurrentLocation}
                disabled={gettingLocation}
              >
                {gettingLocation ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <Navigation className="h-5 w-5 text-blue-500" />
                )}
                <span className="text-xs">Gunakan Lokasi Saat Ini</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-3 flex-col gap-1"
                onClick={() => window.open("https://www.google.com/maps", "_blank")}
              >
                <Map className="h-5 w-5 text-green-500" />
                <span className="text-xs">Buka Google Maps</span>
              </Button>
            </div>

            {/* Coordinate Inputs */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text)]">
                <Crosshair className="h-4 w-4" />
                Koordinat Lokasi
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="latitude" className="text-xs text-[var(--color-text-secondary)]">
                    Latitude (Garis Lintang)
                  </Label>
                  <Input
                    id="latitude"
                    type="number"
                    step="any"
                    placeholder="-6.123456"
                    value={editForm.latitude}
                    onChange={(e) => setEditForm(prev => ({ ...prev, latitude: e.target.value }))}
                    className="font-mono"
                  />
                  <p className="text-xs text-[var(--color-text-secondary)]">Range: -90 s/d 90</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="longitude" className="text-xs text-[var(--color-text-secondary)]">
                    Longitude (Garis Bujur)
                  </Label>
                  <Input
                    id="longitude"
                    type="number"
                    step="any"
                    placeholder="106.123456"
                    value={editForm.longitude}
                    onChange={(e) => setEditForm(prev => ({ ...prev, longitude: e.target.value }))}
                    className="font-mono"
                  />
                  <p className="text-xs text-[var(--color-text-secondary)]">Range: -180 s/d 180</p>
                </div>
              </div>
            </div>

            {/* Radius Input */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-[var(--color-text)]">
                <Ruler className="h-4 w-4" />
                Radius Geofence
              </div>
              <div className="flex items-center gap-3">
                <Input
                  id="radius"
                  type="number"
                  min="10"
                  max="10000"
                  placeholder="100"
                  value={editForm.geofenceRadiusMeters}
                  onChange={(e) => setEditForm(prev => ({ ...prev, geofenceRadiusMeters: e.target.value }))}
                  className="w-32 font-mono"
                />
                <span className="text-sm text-[var(--color-text-secondary)]">meter</span>
                <div className="flex-1" />
                <div className="flex gap-1">
                  {[50, 100, 200, 500].map((r) => (
                    <Button
                      key={r}
                      variant={editForm.geofenceRadiusMeters === r.toString() ? "default" : "outline"}
                      size="sm"
                      className="text-xs px-2"
                      onClick={() => setEditForm(prev => ({ ...prev, geofenceRadiusMeters: r.toString() }))}
                    >
                      {r}m
                    </Button>
                  ))}
                </div>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Jarak maksimal dari titik lokasi yang diizinkan untuk absensi. Disarankan minimal 100m untuk toleransi GPS.
              </p>
            </div>

            {/* Address Input */}
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium text-[var(--color-text)]">
                Alamat Lengkap <span className="text-[var(--color-text-secondary)] font-normal">(opsional)</span>
              </Label>
              <Input
                id="address"
                placeholder="Jl. Contoh No. 123, Kelurahan, Kecamatan"
                value={editForm.address}
                onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setEditBranch(null)}>
              Batal
            </Button>
            <Button onClick={handleSave} disabled={saving || !hasValidCoordinates}>
              {saving ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Simpan Lokasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
