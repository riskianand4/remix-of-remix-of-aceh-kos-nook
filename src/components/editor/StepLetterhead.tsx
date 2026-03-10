import { useState } from "react";
import { DocumentData } from "@/types/document";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Loader2, Upload, X } from "lucide-react";
import { normalizeImage } from "@/lib/image-utils";
import { toast } from "@/hooks/use-toast";

interface Props {
  doc: DocumentData;
  updateDoc: (updates: Partial<DocumentData>) => void;
}

export default function StepLetterhead({ doc, updateDoc }: Props) {
  const [uploading, setUploading] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const dataUrl = await normalizeImage(file, 400);
      updateDoc({ kopLogoDataUrl: dataUrl });
    } catch {
      toast({ title: "Gagal memproses gambar", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const kopLines = (doc.kopText || "").split("\n").filter((l) => l.trim());
  const logoPos = doc.kopLogoPosition || "left";

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          KOP Surat & Footer
        </h2>
        <p className="text-sm text-muted-foreground">
          Desain header (KOP) dan pengaturan footer untuk setiap halaman.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">KOP Surat (Letterhead)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Teks KOP</Label>
            <Textarea
              value={doc.kopText}
              onChange={(e) => updateDoc({ kopText: e.target.value })}
              placeholder="PT. CONTOH INDONESIA&#10;Jl. Sudirman No. 123, Jakarta Pusat&#10;Tel: (021) 123-4567 | Email: info@contoh.co.id"
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Baris pertama otomatis menjadi <strong>bold & besar</strong>{" "}
              (nama perusahaan).
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Logo KOP</Label>
              {doc.kopLogoDataUrl
                ? (
                  <div className="relative flex h-20 w-40 items-center justify-center rounded-lg border bg-muted/30 p-2">
                    <img
                      src={doc.kopLogoDataUrl}
                      alt="Logo KOP"
                      className="max-h-full max-w-full object-contain"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -right-2 -top-2 h-6 w-6"
                      onClick={() => updateDoc({ kopLogoDataUrl: undefined })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )
                : (
                  <label className="flex h-20 w-40 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 transition-colors hover:bg-muted/40">
                    {uploading
                      ? (
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      )
                      : (
                        <>
                          <Upload className="mb-1 h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            Upload
                          </span>
                        </>
                      )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                      disabled={uploading}
                    />
                  </label>
                )}
            </div>
            <div className="space-y-2">
              <Label>Posisi Logo</Label>
              <Select
                value={logoPos}
                onValueChange={(v) =>
                  updateDoc({ kopLogoPosition: v as "left" | "center" })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Kiri (Horizontal)</SelectItem>
                  <SelectItem value="center">Tengah (Vertikal)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* KOP Position */}
          <div className="space-y-2">
            <Label>Posisi KOP</Label>
            <Select
              value={doc.kopPosition || "top"}
              onValueChange={(v) =>
                updateDoc({ kopPosition: v as "top" | "bottom" | "both" })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top">Atas saja</SelectItem>
                <SelectItem value="bottom">Bawah saja</SelectItem>
                <SelectItem value="both">Atas & Bawah</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* KOP Divider */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground text-sm">
                Tampilkan Divider KOP
              </p>
              <p className="text-xs text-muted-foreground">
                Garis pemisah di bawah KOP
              </p>
            </div>
            <Switch
              checked={doc.kopDividerEnabled || false}
              onCheckedChange={(v) => updateDoc({ kopDividerEnabled: v })}
            />
          </div>

          {/* KOP Spacing */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Jarak KOP ke Konten</Label>
              <span className="text-xs font-mono text-muted-foreground">
                {doc.kopSpacing || 8}mm
              </span>
            </div>
            <Slider
              value={[doc.kopSpacing || 8]}
              min={0}
              max={30}
              step={1}
              onValueChange={([v]) => updateDoc({ kopSpacing: v })}
            />
          </div>

          {(doc.kopText || doc.kopLogoDataUrl) && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Preview KOP
              </Label>
              <div className="rounded-lg border bg-white p-4 max-w-2xl relative">
                <div className="flex gap-3 pb-2 items-center">
                  {doc.kopLogoDataUrl && (
                    <img
                      src={doc.kopLogoDataUrl}
                      alt="Logo"
                      className="h-20 object-contain shrink-0"
                    />
                  )}
                  {kopLines.length > 0 && (
                    <div
                      className={`text-xs text-gray-900 leading-relaxed flex-1 ${
                        logoPos === "center" ? "text-center" : "text-left"
                      }`}
                    >
                      <strong className="text-sm block">{kopLines[0]}</strong>
                      {kopLines.slice(1).map((line, i) => (
                        <span key={i}>
                          {line}
                          <br />
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {doc.kopDividerEnabled && (
                  <hr className="border-t-2 border-double border-gray-900 mt-1" />
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">QR Code Verifikasi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground text-sm">
                Tampilkan QR Code
              </p>
              <p className="text-xs text-muted-foreground">
                QR code verifikasi di pojok kiri bawah setiap halaman
              </p>
            </div>
            <Switch
              checked={doc.qrEnabled !== false}
              onCheckedChange={(v) => updateDoc({ qrEnabled: v })}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Footer</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground text-sm">
                Footer Pagination
              </p>
              <p className="text-xs text-muted-foreground">
                "Halaman [X] dari [Y]" di setiap halaman
              </p>
            </div>
            <Switch
              checked={doc.footerEnabled}
              onCheckedChange={(v) => updateDoc({ footerEnabled: v })}
            />
          </div>
          <div className="space-y-2">
            <Label>Teks Footer Custom</Label>
            <Input
              value={doc.footerText || ""}
              onChange={(e) => updateDoc({ footerText: e.target.value })}
              placeholder="PT. Contoh Indonesia - Confidential"
            />
            <p className="text-xs text-muted-foreground">
              Ditampilkan di sisi kiri footer setiap halaman.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
