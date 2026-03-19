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
import { Loader2, Upload, X, Plus, Trash2 } from "lucide-react";
import { normalizeImage } from "@/lib/image-utils";
import { toast } from "@/hooks/use-toast";

interface Props {
  doc: DocumentData;
  updateDoc: (updates: Partial<DocumentData>) => void;
}

export default function StepLetterhead({ doc, updateDoc }: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadingRight, setUploadingRight] = useState(false);

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

  const handleRightLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingRight(true);
    try {
      const dataUrl = await normalizeImage(file, 400);
      updateDoc({ kopLogoRightDataUrl: dataUrl });
    } catch {
      toast({ title: "Gagal memproses gambar", variant: "destructive" });
    } finally {
      setUploadingRight(false);
    }
  };

  const kopLines = (doc.kopText || "").split("\n").filter((l) => l.trim());
  const logoPos = doc.kopLogoPosition || "left";
  const kopIcons = doc.kopIcons || [];
  const kopDividerColor = doc.kopDividerColor || "#000000";
  const kopTextColor = doc.kopTextColor || "#000000";

  const addIcon = () => {
    updateDoc({ kopIcons: [...kopIcons, { svgUrl: "", text: "" }] });
  };

  const updateIcon = (index: number, field: "svgUrl" | "text", value: string) => {
    const updated = [...kopIcons];
    updated[index] = { ...updated[index], [field]: value };
    updateDoc({ kopIcons: updated });
  };

  const removeIcon = (index: number) => {
    updateDoc({ kopIcons: kopIcons.filter((_, i) => i !== index) });
  };

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
            {/* Left Logo */}
            <div className="space-y-2">
              <Label>Logo Kiri</Label>
              {doc.kopLogoDataUrl
                ? (
                  <div className="relative flex h-20 w-40 items-center justify-center rounded-lg border bg-muted/30 p-2">
                    <img
                      src={doc.kopLogoDataUrl}
                      alt="Logo Kiri"
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
                      ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      : (
                        <>
                          <Upload className="mb-1 h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Upload</span>
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
            {/* Right Logo */}
            <div className="space-y-2">
              <Label>Logo Kanan</Label>
              {doc.kopLogoRightDataUrl
                ? (
                  <div className="relative flex h-20 w-40 items-center justify-center rounded-lg border bg-muted/30 p-2">
                    <img
                      src={doc.kopLogoRightDataUrl}
                      alt="Logo Kanan"
                      className="max-h-full max-w-full object-contain"
                    />
                    <Button
                      variant="destructive"
                      size="icon"
                      className="absolute -right-2 -top-2 h-6 w-6"
                      onClick={() => updateDoc({ kopLogoRightDataUrl: undefined })}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )
                : (
                  <label className="flex h-20 w-40 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/20 transition-colors hover:bg-muted/40">
                    {uploadingRight
                      ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      : (
                        <>
                          <Upload className="mb-1 h-4 w-4 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Upload</span>
                        </>
                      )}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleRightLogoUpload}
                      disabled={uploadingRight}
                    />
                  </label>
                )}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Posisi Teks KOP</Label>
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

          {/* KOP Colors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Warna Divider KOP</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={kopDividerColor}
                  onChange={(e) => updateDoc({ kopDividerColor: e.target.value })}
                  className="h-8 w-10 cursor-pointer rounded border border-border"
                />
                <Input
                  value={kopDividerColor}
                  onChange={(e) => updateDoc({ kopDividerColor: e.target.value })}
                  className="font-mono text-xs"
                  placeholder="#000000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Warna Teks KOP</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={kopTextColor}
                  onChange={(e) => updateDoc({ kopTextColor: e.target.value })}
                  className="h-8 w-10 cursor-pointer rounded border border-border"
                />
                <Input
                  value={kopTextColor}
                  onChange={(e) => updateDoc({ kopTextColor: e.target.value })}
                  className="font-mono text-xs"
                  placeholder="#000000"
                />
              </div>
            </div>
          </div>

          {/* KOP Spacing info */}
          <div className="rounded-md bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">
              <strong>Jarak KOP ke Konten:</strong> 1mm (tetap / tidak dapat diubah)
            </p>
          </div>

          {/* SVG Icons */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Ikon KOP (SVG / Link Gambar)</Label>
              <Button variant="outline" size="sm" onClick={addIcon}>
                <Plus className="h-3 w-3 mr-1" /> Tambah Ikon
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Sisipkan ikon SVG inline (paste kode {'<svg>...</svg>'}) atau link gambar (URL). Tampil sejajar dengan teks.
            </p>
            {kopIcons.map((icon, i) => (
              <div key={i} className="flex items-start gap-2 rounded-lg border p-3">
                <div className="flex-1 space-y-2">
                  <Textarea
                    value={icon.svgUrl}
                    onChange={(e) => updateIcon(i, "svgUrl", e.target.value)}
                    placeholder={'Paste kode SVG: <svg xmlns="...">...</svg>\natau link gambar: https://...'}
                    className="text-xs min-h-[60px]"
                    rows={2}
                  />
                  <Input
                    value={icon.text}
                    onChange={(e) => updateIcon(i, "text", e.target.value)}
                    placeholder="Teks label, contoh: (021) 123-4567"
                    className="text-xs"
                  />
                </div>
                {icon.svgUrl && (
                  icon.svgUrl.trim().startsWith("<svg")
                    ? <div className="h-5 w-5 mt-1 shrink-0 [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: icon.svgUrl }} />
                    : <img src={icon.svgUrl} alt="" className="h-5 w-5 mt-1 shrink-0" />
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 shrink-0 text-destructive"
                  onClick={() => removeIcon(i)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          {/* Preview KOP */}
          {(doc.kopText || doc.kopLogoDataUrl || doc.kopLogoRightDataUrl) && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Preview KOP
              </Label>
              <div className="rounded-lg border bg-white p-4 max-w-2xl relative">
                
                {/* Divider di atas untuk KOP Bawah */}
                {doc.kopPosition === "bottom" && doc.kopDividerEnabled && (
                  <hr style={{ borderTop: `7px solid ${kopDividerColor}` }} className="mb-3 rounded-sm " />
                )}

                <div className="flex gap-3 items-center">
                  {doc.kopLogoDataUrl && (
                    <img
                      src={doc.kopLogoDataUrl}
                      alt="Logo Kiri"
                      className="h-16 object-contain shrink-0"
                    />
                  )}
                  {kopLines.length > 0 && (
                    <div
                      className={`text-xs leading-relaxed flex-1 ${
                        logoPos === "center" ? "text-center" : "text-left"
                      }`}
                      style={{ color: kopTextColor }}
                    >
                      <strong className="text-sm block mb-1">{kopLines[0]}</strong>
                      {kopLines.slice(1).map((line, i) => (
                        <span key={i}>
                          {line}
                          <br />
                        </span>
                      ))}
                      {/* Ikon KOP - inside text div for centering */}
                      {kopIcons.length > 0 && kopIcons.some(ic => ic.svgUrl || ic.text) && (
                        <div className=" flex-wrap gap-3 mt-2 flex items-center justify-center " style={{ color: kopTextColor }}>
                          {kopIcons.filter(ic => ic.svgUrl || ic.text).map((ic, i) => (
                            <span key={i} className="flex items-center  gap-1 text-xs">
                              {ic.svgUrl && (
                                ic.svgUrl.trim().startsWith("<svg")
                                  ? <span className="h-4 w-4 [&>svg]:w-full [&>svg]:h-full" dangerouslySetInnerHTML={{ __html: ic.svgUrl }} />
                                  : <img src={ic.svgUrl} alt="" className="h-4 w-4" />
                              )}
                              {ic.text}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {doc.kopLogoRightDataUrl && (
                    <img
                      src={doc.kopLogoRightDataUrl}
                      alt="Logo Kanan"
                      className="h-16 object-contain shrink-0"
                    />
                  )}
                </div>

                {/* Divider di bawah untuk KOP Atas */}
                {doc.kopPosition !== "bottom" && doc.kopDividerEnabled && (
                  <hr style={{ borderTop: `3px solid ${kopDividerColor}` }} className="mt-3" />
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
                QR code verifikasi di pojok kiri bawah halaman terakhir
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
