import { useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { changePassword, updateProfile } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Camera, Check, Loader2, Lock, User } from "lucide-react";

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();

  // ─── Name & Avatar state ───
  const [name, setName] = useState(user?.name || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ─── Password state ───
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "Ukuran file terlalu besar",
        description: "Maksimal 2MB",
        variant: "destructive",
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await updateProfile({ name: name.trim(), avatarUrl });
      await refreshUser();
      toast({ title: "✓ Profil berhasil diperbarui" });
    } catch (err: any) {
      toast({
        title: "Gagal memperbarui profil",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast({
        title: "Semua field password wajib diisi",
        variant: "destructive",
      });
      return;
    }
    if (newPassword.length < 6) {
      toast({
        title: "Password baru minimal 6 karakter",
        variant: "destructive",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({
        title: "Konfirmasi password tidak cocok",
        variant: "destructive",
      });
      return;
    }
    setSavingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast({ title: "✓ Password berhasil diubah" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast({
        title: "Gagal mengubah password",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSavingPassword(false);
    }
  };

  const initials = (user?.name || user?.email || "U")[0].toUpperCase();

  return (
    <div className="max-w-8xl mx-auto py-8 px-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profil Saya</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola informasi akun dan keamanan Anda
        </p>
      </div>

      {/* Avatar & Name */}
      <div className=" flex gap-5 ">
        <Card className=" flex-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> Informasi Profil
            </CardTitle>
            <CardDescription>
              Perbarui nama tampilan dan foto profil Anda
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="h-20 w-20 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center ring-2 ring-border">
                  {avatarUrl
                    ? (
                      <img
                        src={avatarUrl}
                        alt="Avatar"
                        className="h-full w-full object-cover"
                      />
                    )
                    : (
                      <span className="text-2xl font-bold text-primary">
                        {initials}
                      </span>
                    )}
                </div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-primary flex items-center justify-center shadow-md hover:bg-primary/90 transition-colors"
                >
                  <Camera className="h-3 w-3 text-primary-foreground" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {user?.name || "Pengguna"}
                </p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-primary hover:underline mt-1"
                >
                  Ganti foto
                </button>
              </div>
            </div>

            <Separator />

            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-xs">Nama Tampilan</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nama Anda..."
                className="max-w-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Email</Label>
              <Input
                value={user?.email || ""}
                disabled
                className="max-w-sm bg-muted/50"
              />
              <p className="text-[11px] text-muted-foreground">
                Email tidak dapat diubah
              </p>
            </div>

            <Button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="gap-2"
            >
              {savingProfile
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Check className="h-4 w-4" />}
              Simpan Perubahan
            </Button>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" /> Ubah Password
            </CardTitle>
            <CardDescription>
              Pastikan akun Anda menggunakan password yang kuat
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {user?.googleId && (
              <div className="rounded-md bg-muted/50 border px-3 py-2">
                <p className="text-xs text-muted-foreground">
                  Akun Anda terhubung via Google. Masukkan password lama jika
                  sudah diset, atau biarkan kosong jika ingin set password baru.
                </p>
              </div>
            )}
            <div className="space-y-1.5">
              <Label className="text-xs">Password Saat Ini</Label>
              <Input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                className="max-w-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Password Baru</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="max-w-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Konfirmasi Password Baru</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi password baru"
                className="max-w-sm"
                onKeyDown={(e) => e.key === "Enter" && handleChangePassword()}
              />
            </div>
            <Button
              onClick={handleChangePassword}
              disabled={savingPassword}
              variant="outline"
              className="gap-2"
            >
              {savingPassword
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Lock className="h-4 w-4" />}
              Ubah Password
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
