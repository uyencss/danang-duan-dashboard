"use client";

import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Shield, Camera, MonitorSmartphone, Radio, Lightbulb, Users, Building, HelpCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export function DashboardTabs({ data }: { data: any[] }) {
  const [selectedUnit, setSelectedUnit] = useState<any | null>(null);
  const [filters, setFilters] = useState<Record<string, string>>({});

  const handleFilterChange = (field: string, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Helper to split comma-separated strings and count
  const countOcurrences = (arr: any[], key: string) => {
    const counts: Record<string, number> = {};
    arr.forEach(item => {
      if (!item[key]) return;
      const parts = item[key].split(",").map((s: string) => s.trim()).filter(Boolean);
      parts.forEach((p: string) => {
        counts[p] = (counts[p] || 0) + 1;
      });
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  };

  const countCategorical = (arr: any[], key: string, isBoolean = false) => {
    const counts: Record<string, number> = {};
    arr.forEach(item => {
      let val = item[key];
      if (isBoolean) val = val ? "Có nhu cầu" : "Chưa có nhu cầu";
      if (!val) val = "Không rõ";
      counts[val] = (counts[val] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  const { unifiedData, conflicts } = useMemo(() => {
    // Aggressive normalization for unit names to catch slightly different spellings
    const normalizeUnitName = (name: string) => {
      if (!name) return "không rõ";
      // First clean up all punctuations and extra spaces to normalize "C.A.P", "C/A/P"
      let s = name.toLowerCase().replace(/[\.\,\-\/]/g, " ").replace(/\s+/g, ' ').trim();
      
      const prefixes = [
        "công an thành phố", "công an phường", "công an huyện", "công an quận", "công an xã", "công an",
        "ca thành phố", "ca phường", "ca huyện", "ca quận", "ca xã",
        "phòng", "ban", "tổ", "đội", "tiểu ban", "đơn vị",
        "cap", "cax", "catp", "cah", "caq", "ca p", "ca x",
        "phường", "xã", "quận", "huyện"
      ];

      prefixes.sort((a, b) => b.length - a.length);

      let foundPrefix = true;
      while (foundPrefix) {
        foundPrefix = false;
        for (const p of prefixes) {
          if (s.startsWith(p)) {
            s = s.slice(p.length).trim();
            foundPrefix = true;
            break;
          }
        }
      }

      return s || "không rõ";
    };

    // Normalize diacritics for grouping key only (strip all accents for comparison)
    const removeAccents = (str: string) =>
      str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/đ/g, "d").replace(/Đ/g, "D");

    const groups: Record<string, any[]> = {};
    data.forEach(row => {
      // Use accent-stripped key for grouping, but preserve original in data
      const normalizedName = normalizeUnitName(row.tenDonVi);
      const unitKey = removeAccents(normalizedName).toLowerCase();
      if (!groups[unitKey]) groups[unitKey] = [];
      groups[unitKey].push(row);
    });

    const unified: any[] = [];
    const unitConflicts: any[] = [];

    // Shared merge helper - also used for single-row units so all text fields are consistently processed
    const mergeTextFields = (rows: any[]) => {
      const mergeText = (key: string) => {
        const allValues = rows.map(r => r[key]).filter(Boolean);
        // Case-insensitive deduplication
        const seen = new Map<string, string>(); // lowercase -> original
        allValues.forEach(val => {
          const parts = val.toString().split(/[\|,;\n]/).map((s: string) => s.trim()).filter(Boolean);
          parts.forEach((p: string) => {
            const key = p.toLowerCase();
            if (!seen.has(key)) seen.set(key, p);
          });
        });
        return Array.from(seen.values()).join(" | ");
      };
      return {
        mucDichCamera: mergeText('mucDichCamera'),
        khuVucCamera: mergeText('khuVucCamera'),
        mucDichKiosk: mergeText('mucDichKiosk'),
        khuVucKiosk: mergeText('khuVucKiosk'),
        mucDichTruyenThanh: mergeText('mucDichTruyenThanh'),
        khuVucTruyenThanh: mergeText('khuVucTruyenThanh'),
        deXuatKhac: mergeText('deXuatKhac'),
      };
    };

    for (const [unitKey, rows] of Object.entries(groups)) {
      if (rows.length === 1) {
        const merged = mergeTextFields(rows);
        unified.push({ ...rows[0], ...merged, respondents: rows });
        continue;
      }

      // Check substantive conflicts across all key fields
      const toBool = (v: any) => {
        if (typeof v === 'boolean') return v;
        if (typeof v === 'string') {
          const s = v.toLowerCase().trim();
          return s === 'có' || s === 'true' || s === 'yes' || s === '1';
        }
        return !!v;
      };

      const checkConflict = (field: string, isBoolean = false) => {
        const uniqueValues = new Set(rows.map(r => {
          const v = r[field];
          if (isBoolean) return toBool(v);
          // Normalize status strings for comparison
          return (v || "").toString().trim().toLowerCase();
        }));
        return uniqueValues.size > 1;
      };

      const conflictCam = checkConflict('nhuCauCamera', true);
      const conflictCamStatus = checkConflict('daCoCamera');
      const conflictKiosk = checkConflict('nhuCauKiosk', true);
      const conflictKioskStatus = checkConflict('daCoKiosk');
      const conflictTruyenThanh = checkConflict('nhuCauTruyenThanh', true);
      const conflictTruyenThanhStatus = checkConflict('daCoTruyenThanh');

      // Use the longest name variant for the unit label
      const unitLabel = rows.map(r => r.tenDonVi).sort((a,b) => b.length - a.length)[0];

      const unifiedRow = { ...rows[0], tenDonVi: unitLabel, respondents: rows };
      
      // Conflict Resolution based on "Leadership Priority"
      const getLeaderDecision = (field: string, isBoolean = false) => {
        // Find Leader (Trưởng) or Deputy (Phó)
        // Check for "Trưởng" first (avoiding "Phó Trưởng")
        const truong = rows.find(r => {
          const role = (r.chucVu || "").toLowerCase();
          return role.includes("trưởng") && !role.includes("phó");
        });
        if (truong) return isBoolean ? toBool(truong[field]) : truong[field];

        const pho = rows.find(r => (r.chucVu || "").toLowerCase().includes("phó"));
        if (pho) return isBoolean ? toBool(pho[field]) : pho[field];

        // Fallback: Default to Conservative strategy if no leader identified
        if (isBoolean) return true; // Default requirement to "Có"
        return "Chưa có"; // Default status
      };

      if (conflictCam) unifiedRow.nhuCauCamera = getLeaderDecision('nhuCauCamera', true);
      if (conflictCamStatus) unifiedRow.daCoCamera = getLeaderDecision('daCoCamera');
      if (conflictKiosk) unifiedRow.nhuCauKiosk = getLeaderDecision('nhuCauKiosk', true);
      if (conflictKioskStatus) unifiedRow.daCoKiosk = getLeaderDecision('daCoKiosk');
      if (conflictTruyenThanh) unifiedRow.nhuCauTruyenThanh = getLeaderDecision('nhuCauTruyenThanh', true);
      if (conflictTruyenThanhStatus) unifiedRow.daCoTruyenThanh = getLeaderDecision('daCoTruyenThanh');

      const merged = mergeTextFields(rows);
      Object.assign(unifiedRow, merged);

      unified.push(unifiedRow);

      if (conflictCam || conflictCamStatus || conflictKiosk || conflictKioskStatus || conflictTruyenThanh || conflictTruyenThanhStatus) {
         unitConflicts.push({ 
           unit: unitLabel, 
           rows, 
           conflictCam, 
           conflictCamStatus, 
           conflictKiosk, 
           conflictKioskStatus, 
           conflictTruyenThanh, 
           conflictTruyenThanhStatus 
         });
      }
    }

    return { unifiedData: unified, conflicts: unitConflicts };
  }, [data]);

  const filteredUnifiedData = useMemo(() => {
    return (unifiedData as any[]).filter(row => {
      return Object.entries(filters).every(([field, searchValue]) => {
        if (!searchValue) return true;
        const searchLower = searchValue.toLowerCase();
        
        // Handle STT filter separately if needed, but usually we filter by unit/status
        if (field === 'stt') {
          const stt = (unifiedData.indexOf(row) + 1).toString();
          return stt.includes(searchValue);
        }

        const rowValue = row[field];
        
        if (typeof rowValue === 'boolean') {
          const boolValue = rowValue ? 'có' : 'không';
          return boolValue.includes(searchLower);
        }

        return (rowValue || "").toString().toLowerCase().includes(searchLower);
      });
    });
  }, [unifiedData, filters]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

  // Camera Data
  const cameraCo = useMemo(() => countCategorical(unifiedData, "daCoCamera"), [unifiedData]);
  const cameraNhuCau = useMemo(() => countCategorical(unifiedData, "nhuCauCamera", true), [unifiedData]);
  const cameraMucDich = useMemo(() => countOcurrences(unifiedData, "mucDichCamera"), [unifiedData]);
  const cameraKhuVuc = useMemo(() => countOcurrences(unifiedData, "khuVucCamera"), [unifiedData]);

  // Kiosk Data
  const kioskCo = useMemo(() => countCategorical(unifiedData, "daCoKiosk"), [unifiedData]);
  const kioskNhuCau = useMemo(() => countCategorical(unifiedData, "nhuCauKiosk", true), [unifiedData]);
  const kioskMucDich = useMemo(() => countOcurrences(unifiedData, "mucDichKiosk"), [unifiedData]);

  // Truyền thanh Data
  const truyenThanhCo = useMemo(() => countCategorical(unifiedData, "daCoTruyenThanh"), [unifiedData]);
  const truyenThanhNhuCau = useMemo(() => countCategorical(unifiedData, "nhuCauTruyenThanh", true), [unifiedData]);
  const truyenThanhMucDich = useMemo(() => countOcurrences(unifiedData, "mucDichTruyenThanh"), [unifiedData]);
  const truyenThanhKhuVuc = useMemo(() => countOcurrences(unifiedData, "khuVucTruyenThanh"), [unifiedData]);

  const renderPieChart = (chartData: any[], title: string) => (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-slate-700">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <RechartsTooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a' }} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  const renderBarChart = (chartData: any[], title: string) => (
    <Card className="bg-white border-slate-200 shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold text-slate-700">{title}</CardTitle>
      </CardHeader>
      <CardContent className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" margin={{ left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
            <XAxis type="number" stroke="#64748b" />
            <YAxis dataKey="name" type="category" width={120} stroke="#64748b" tick={{ fontSize: 11 }} />
            <RechartsTooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', color: '#0f172a' }} />
            <Bar dataKey="value" fill="#0070eb" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );

  return (
    <>
      <Tabs defaultValue="camera" className="mt-8 space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200">
          <TabsTrigger value="camera" className="data-[state=active]:bg-[#0070eb] data-[state=active]:text-white text-slate-600 flex items-center gap-2 px-6 font-medium">
            <Camera className="w-4 h-4" /> I. Camera Giám Sát
          </TabsTrigger>
          <TabsTrigger value="kiosk" className="data-[state=active]:bg-[#0070eb] data-[state=active]:text-white text-slate-600 flex items-center gap-2 px-6 font-medium">
            <MonitorSmartphone className="w-4 h-4" /> II. Kiosk Tiếp Dân
          </TabsTrigger>
          <TabsTrigger value="truyenthanh" className="data-[state=active]:bg-[#0070eb] data-[state=active]:text-white text-slate-600 flex items-center gap-2 px-6 font-medium">
            <Radio className="w-4 h-4" /> III. Truyền Thanh
          </TabsTrigger>
          <TabsTrigger value="dexuat" className="data-[state=active]:bg-[#0070eb] data-[state=active]:text-white text-slate-600 flex items-center gap-2 px-6 font-medium">
            <Lightbulb className="w-4 h-4" /> IV. Đề Xuất Khác
          </TabsTrigger>
        </TabsList>

        {/* HELPER FOR CONFLICT WARNING */}
        {(() => {
          const RenderConflictSection = ({ mode, category }: { mode: 'YES' | 'NO', category: 'Camera' | 'Kiosk' | 'Truyền thanh' }) => {
            const relevantConflicts = conflicts.filter(c => {
              if (mode === 'YES') {
                if (category === 'Camera') return c.conflictCam;
                if (category === 'Kiosk') return c.conflictKiosk;
                if (category === 'Truyền thanh') return c.conflictTruyenThanh;
              } else {
                if (category === 'Camera') return c.conflictCamStatus;
                if (category === 'Kiosk') return c.conflictKioskStatus;
                if (category === 'Truyền thanh') return c.conflictTruyenThanhStatus;
              }
              return false;
            });

            if (relevantConflicts.length === 0) return null;

            const title = mode === 'YES' 
              ? `Bảng 1: Cảnh báo dữ liệu (${category}) - Quy theo ý kiến Lãnh đạo (Có)`
              : `Bảng 2: Cảnh báo dữ liệu (${category}) - Quy theo ý kiến Lãnh đạo (Chưa có)`;

            return (
              <div className="mt-8">
                <div className="flex items-center gap-2 mb-4">
                  <div className={`p-1.5 rounded-lg ${mode === 'YES' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'}`}>
                    <HelpCircle className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-lg">{title}</h4>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {relevantConflicts.map((c, i) => (
                    <div key={i} className="bg-white rounded-xl border border-slate-200 p-0 overflow-hidden shadow-sm hover:shadow-md transition-all">
                      <div className="bg-slate-50 px-4 py-3 border-b border-slate-200">
                        <p className="font-bold text-slate-800 flex items-center gap-2">
                          <Building className="w-4 h-4 text-slate-400" />
                          {c.unit}
                        </p>
                      </div>
                      <div className="p-4">
                        <ul className="space-y-3">
                          {c.rows.map((r: any, idx: number) => {
                            let val: any = false;
                            let displayVal = "";
                            let fieldName = "";

                            const toBoolLocal = (v: any) => {
                              if (typeof v === 'boolean') return v;
                              if (typeof v === 'string') {
                                const s = v.toLowerCase().trim();
                                return s === 'có' || s === 'true' || s === 'yes' || s === '1';
                              }
                              return !!v;
                            };

                            if (mode === 'YES') {
                              if (category === 'Camera') { fieldName = 'nhuCauCamera'; val = r[fieldName]; }
                              if (category === 'Kiosk') { fieldName = 'nhuCauKiosk'; val = r[fieldName]; }
                              if (category === 'Truyền thanh') { fieldName = 'nhuCauTruyenThanh'; val = r[fieldName]; }
                              displayVal = toBoolLocal(val) ? 'Có nhu cầu' : 'Không có';
                            } else {
                              if (category === 'Camera') { fieldName = 'daCoCamera'; val = r[fieldName]; }
                              if (category === 'Kiosk') { fieldName = 'daCoKiosk'; val = r[fieldName]; }
                              if (category === 'Truyền thanh') { fieldName = 'daCoTruyenThanh'; val = r[fieldName]; }
                              displayVal = val || 'Chưa rõ';
                            }
                            
                            const isPositive = toBoolLocal(val) || (typeof val === 'string' && val.toLowerCase().includes('đã có'));

                            return (
                              <li key={idx} className="flex flex-col gap-1.5 bg-slate-50/50 p-2.5 rounded-lg border border-slate-100">
                                <div className="flex justify-between items-start">
                                  <span className="text-sm font-semibold text-slate-700">{r.nguoiKhaoSat || "Ẩn danh"}</span>
                                  <Badge className={isPositive ? 'bg-green-50 text-green-700 border-green-100' : 'bg-slate-100 text-slate-600 border-slate-200'}>
                                    {displayVal}
                                  </Badge>
                                </div>
                                <span className="text-xs text-slate-500 italic">{r.chucVu || "Không rõ chức vụ"}</span>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          };

          return (
            <>
              {/* ---------------- CAMERA TAB ---------------- */}
              <TabsContent value="camera" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {renderPieChart(cameraCo, "Tình trạng sử dụng")}
            {renderPieChart(cameraNhuCau, "Nhu cầu cải tạo/lắp mới")}
            <div className="xl:col-span-2">
              {renderBarChart(cameraMucDich, "Mục đích sử dụng (tần suất)")}
            </div>
            <div className="xl:col-span-4">
              {renderBarChart(cameraKhuVuc, "Khu vực lắp đặt (tần suất)")}
            </div>
          </div>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-800">Danh sách chi tiết</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-slate-200 overflow-hidden bg-white">
                <Table>
                  <TableHeader className="bg-slate-50 border-b border-slate-200">
                    <TableRow>
                      <TableHead className="text-slate-700 font-semibold w-[60px]">
                        <div className="flex flex-col gap-2">
                          <span>STT</span>
                          <Input size={1} className="h-7 px-1 text-[10px] font-normal" placeholder="Lọc..." onChange={(e) => handleFilterChange('stt', e.target.value)} />
                        </div>
                      </TableHead>
                      <TableHead className="text-slate-700 font-semibold">
                        <div className="flex flex-col gap-2">
                          <span>Đơn vị</span>
                          <Input className="h-7 text-xs font-normal" placeholder="Tìm đơn vị..." onChange={(e) => handleFilterChange('tenDonVi', e.target.value)} />
                        </div>
                      </TableHead>
                      <TableHead className="text-slate-700 font-semibold">
                        <div className="flex flex-col gap-2">
                          <span>Hiện trạng</span>
                          <Input className="h-7 text-xs font-normal" placeholder="Lọc..." onChange={(e) => handleFilterChange('daCoCamera', e.target.value)} />
                        </div>
                      </TableHead>
                      <TableHead className="text-slate-700 font-semibold">
                        <div className="flex flex-col gap-2">
                          <span>Nhu cầu mới</span>
                          <Input className="h-7 text-xs font-normal" placeholder="Lọc..." onChange={(e) => handleFilterChange('nhuCauCamera', e.target.value)} />
                        </div>
                      </TableHead>
                      <TableHead className="text-slate-700 font-semibold">
                        <div className="flex flex-col gap-2">
                          <span>Mục đích</span>
                          <Input className="h-7 text-xs font-normal" placeholder="Lọc..." onChange={(e) => handleFilterChange('mucDichCamera', e.target.value)} />
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUnifiedData.map((row, index) => {
                      const originalIndex = unifiedData.indexOf(row);
                      return (
                        <TableRow key={row.tenDonVi || originalIndex} className="cursor-pointer hover:bg-slate-50 border-b border-slate-100" onClick={() => setSelectedUnit(row)}>
                          <TableCell className="text-slate-500 font-mono text-xs">{originalIndex + 1}</TableCell>
                          <TableCell className="font-medium text-slate-800">{row.tenDonVi}</TableCell>
                          <TableCell><Badge variant="outline" className="text-slate-600 border-slate-300">{row.daCoCamera || "Không rõ"}</Badge></TableCell>
                          <TableCell>{row.nhuCauCamera ? <Badge className="bg-green-100 text-green-700 border-green-200">Có</Badge> : <Badge className="bg-slate-100 text-slate-600">Không</Badge>}</TableCell>
                          <TableCell className="text-slate-600 max-w-[350px] whitespace-normal break-words py-2 leading-relaxed">{row.mucDichCamera}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          
          <RenderConflictSection mode="YES" category="Camera" />
          <RenderConflictSection mode="NO" category="Camera" />
        </TabsContent>

        {/* ---------------- KIOSK TAB ---------------- */}
        <TabsContent value="kiosk" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {renderPieChart(kioskCo, "Tình trạng sử dụng")}
            {renderPieChart(kioskNhuCau, "Nhu cầu sử dụng")}
            {renderBarChart(kioskMucDich, "Mục đích sử dụng")}
          </div>

          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-800">Danh sách chi tiết</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-slate-200 overflow-hidden bg-white">
                <Table>
                  <TableHeader className="bg-slate-50 border-b border-slate-200">
                    <TableRow>
                      <TableHead className="text-slate-700 font-semibold w-[60px]">
                        <div className="flex flex-col gap-2">
                          <span>STT</span>
                          <Input size={1} className="h-7 px-1 text-[10px] font-normal" placeholder="Lọc..." onChange={(e) => handleFilterChange('stt', e.target.value)} />
                        </div>
                      </TableHead>
                      <TableHead className="text-slate-700 font-semibold">
                        <div className="flex flex-col gap-2">
                          <span>Đơn vị</span>
                          <Input className="h-7 text-xs font-normal" placeholder="Tìm đơn vị..." onChange={(e) => handleFilterChange('tenDonVi', e.target.value)} />
                        </div>
                      </TableHead>
                      <TableHead className="text-slate-700 font-semibold">
                        <div className="flex flex-col gap-2">
                          <span>Hiện trạng</span>
                          <Input className="h-7 text-xs font-normal" placeholder="Lọc..." onChange={(e) => handleFilterChange('daCoKiosk', e.target.value)} />
                        </div>
                      </TableHead>
                      <TableHead className="text-slate-700 font-semibold">
                        <div className="flex flex-col gap-2">
                          <span>Nhu cầu mới</span>
                          <Input className="h-7 text-xs font-normal" placeholder="Lọc..." onChange={(e) => handleFilterChange('nhuCauKiosk', e.target.value)} />
                        </div>
                      </TableHead>
                      <TableHead className="text-slate-700 font-semibold">
                        <div className="flex flex-col gap-2">
                          <span>Mục đích</span>
                          <Input className="h-7 text-xs font-normal" placeholder="Lọc..." onChange={(e) => handleFilterChange('mucDichKiosk', e.target.value)} />
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUnifiedData.map((row, index) => {
                      const originalIndex = unifiedData.indexOf(row);
                      return (
                        <TableRow key={row.tenDonVi || originalIndex} className="cursor-pointer hover:bg-slate-50 border-b border-slate-100" onClick={() => setSelectedUnit(row)}>
                          <TableCell className="text-slate-500 font-mono text-xs">{originalIndex + 1}</TableCell>
                          <TableCell className="font-medium text-slate-800">{row.tenDonVi}</TableCell>
                          <TableCell><Badge variant="outline" className="text-slate-600 border-slate-300">{row.daCoKiosk || "Không rõ"}</Badge></TableCell>
                          <TableCell>{row.nhuCauKiosk ? <Badge className="bg-green-100 text-green-700 border-green-200">Có</Badge> : <Badge className="bg-slate-100 text-slate-600">Không</Badge>}</TableCell>
                          <TableCell className="text-slate-600 max-w-[350px] whitespace-normal break-words py-2 leading-relaxed">{row.mucDichKiosk}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <RenderConflictSection mode="YES" category="Kiosk" />
          <RenderConflictSection mode="NO" category="Kiosk" />
        </TabsContent>

        {/* ---------------- TRUYEN THANH TAB ---------------- */}
        <TabsContent value="truyenthanh" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {renderPieChart(truyenThanhCo, "Tình trạng lắp đặt")}
            {renderPieChart(truyenThanhNhuCau, "Nhu cầu bổ sung/mới")}
            <div className="xl:col-span-2">
              {renderBarChart(truyenThanhMucDich, "Mục đích sử dụng")}
            </div>
            <div className="xl:col-span-4">
              {renderBarChart(truyenThanhKhuVuc, "Khu vực lắp đặt")}
            </div>
          </div>
          
          <Card className="bg-white border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle className="text-slate-800">Danh sách chi tiết</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border border-slate-200 overflow-hidden bg-white">
                <Table>
                  <TableHeader className="bg-slate-50 border-b border-slate-200">
                    <TableRow>
                      <TableHead className="text-slate-700 font-semibold w-[60px]">
                        <div className="flex flex-col gap-2">
                          <span>STT</span>
                          <Input size={1} className="h-7 px-1 text-[10px] font-normal" placeholder="Lọc..." onChange={(e) => handleFilterChange('stt', e.target.value)} />
                        </div>
                      </TableHead>
                      <TableHead className="text-slate-700 font-semibold">
                        <div className="flex flex-col gap-2">
                          <span>Đơn vị</span>
                          <Input className="h-7 text-xs font-normal" placeholder="Tìm đơn vị..." onChange={(e) => handleFilterChange('tenDonVi', e.target.value)} />
                        </div>
                      </TableHead>
                      <TableHead className="text-slate-700 font-semibold">
                        <div className="flex flex-col gap-2">
                          <span>Hiện trạng</span>
                          <Input className="h-7 text-xs font-normal" placeholder="Lọc..." onChange={(e) => handleFilterChange('daCoTruyenThanh', e.target.value)} />
                        </div>
                      </TableHead>
                      <TableHead className="text-slate-700 font-semibold">
                        <div className="flex flex-col gap-2">
                          <span>Nhu cầu mới</span>
                          <Input className="h-7 text-xs font-normal" placeholder="Lọc..." onChange={(e) => handleFilterChange('nhuCauTruyenThanh', e.target.value)} />
                        </div>
                      </TableHead>
                      <TableHead className="text-slate-700 font-semibold">
                        <div className="flex flex-col gap-2">
                          <span>Khu vực</span>
                          <Input className="h-7 text-xs font-normal" placeholder="Lọc..." onChange={(e) => handleFilterChange('khuVucTruyenThanh', e.target.value)} />
                        </div>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUnifiedData.map((row, index) => {
                      const originalIndex = unifiedData.indexOf(row);
                      return (
                        <TableRow key={row.tenDonVi || originalIndex} className="cursor-pointer hover:bg-slate-50 border-b border-slate-100" onClick={() => setSelectedUnit(row)}>
                          <TableCell className="text-slate-500 font-mono text-xs">{originalIndex + 1}</TableCell>
                          <TableCell className="font-medium text-slate-800">{row.tenDonVi}</TableCell>
                          <TableCell><Badge variant="outline" className="text-slate-600 border-slate-300">{row.daCoTruyenThanh || "Không rõ"}</Badge></TableCell>
                          <TableCell>{row.nhuCauTruyenThanh ? <Badge className="bg-green-100 text-green-700 border-green-200">Có</Badge> : <Badge className="bg-slate-100 text-slate-600">Không</Badge>}</TableCell>
                          <TableCell className="text-slate-600 max-w-[350px] whitespace-normal break-words py-2 leading-relaxed">{row.khuVucTruyenThanh}</TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          
          <RenderConflictSection mode="YES" category="Truyền thanh" />
          <RenderConflictSection mode="NO" category="Truyền thanh" />
        </TabsContent>

        <TabsContent value="dexuat" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {unifiedData.filter(u => u.deXuatKhac && u.deXuatKhac.length > 5).map((row, index) => (
              <Card key={row.tenDonVi || index} className="bg-white border-slate-200 shadow-sm hover:border-[#0070eb] hover:shadow-md transition-all cursor-pointer" onClick={() => setSelectedUnit(row)}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-start gap-2 text-slate-800">
                    <span className="text-slate-300 font-mono text-base mt-0.5">#{index + 1}</span>
                    <Lightbulb className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" />
                    {row.tenDonVi}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-yellow-50/50 p-4 rounded-lg text-sm text-slate-700 italic border border-yellow-100">
                    "{row.deXuatKhac}"
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><Users className="w-3 h-3"/> Chỉ huy / Đơn vị đề xuất</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {unifiedData.filter(u => u.deXuatKhac && u.deXuatKhac.length > 5).length === 0 && (
            <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-300 text-slate-500">
              <HelpCircle className="w-12 h-12 mx-auto mb-4 opacity-30" />
              <p>Chưa ghi nhận đề xuất khác từ các đơn vị.</p>
            </div>
          )}
        </TabsContent>
      </>)})()}
    </Tabs>

      {/* MASTER-DETAIL SHEET */}
      <Sheet open={!!selectedUnit} onOpenChange={(open) => !open && setSelectedUnit(null)}>
        <SheetContent side="right" className="w-[90vw] sm:max-w-2xl bg-white border-slate-200 p-0 text-slate-800 shadow-2xl">
          <SheetHeader className="p-6 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50">
            <SheetTitle className="text-xl text-slate-900 flex items-center gap-3">
              <Building className="w-6 h-6 text-[#0070eb]" />
              {selectedUnit?.tenDonVi}
            </SheetTitle>
            <div className="flex items-center gap-2 mt-2 text-sm text-slate-500 font-medium">
              <Users className="w-4 h-4 text-[#0070eb]"/>
              Tổng hợp từ <span className="text-[#0070eb] font-bold mx-1">{selectedUnit?.respondents?.length || 0}</span> cán bộ / lãnh đạo
            </div>
          </SheetHeader>

          <ScrollArea className="h-[calc(100vh-130px)] bg-white">
            {selectedUnit && (
              <div className="divide-y divide-slate-100">
                {/* --- PER-RESPONDENT CARDS --- */}
                {(selectedUnit.respondents as any[])?.map((r: any, idx: number) => {
                  const isLeader = (r.chucVu || "").toLowerCase().includes("trưởng") || (r.chucVu || "").toLowerCase().includes("phó");
                  return (
                    <div key={idx} className="p-5 hover:bg-slate-50/80 transition-colors">
                      {/* Person header */}
                      <div className="flex items-center gap-2 mb-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${isLeader ? 'bg-[#0070eb]' : 'bg-slate-400'}`}>
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{r.nguoiKhaoSat || "Không rõ"}</p>
                          <Badge className={`text-[10px] py-0 mt-0.5 ${isLeader ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-slate-100 text-slate-600 border-slate-200'}`} variant="outline">
                            {isLeader ? '👑 ' : ''}{r.chucVu || "Cán bộ"}
                          </Badge>
                        </div>
                      </div>

                      {/* Camera */}
                      <div className="mb-3 bg-blue-50/50 rounded-lg p-3 border border-blue-100">
                        <p className="text-xs font-bold text-blue-700 flex items-center gap-1 mb-2"><Camera className="w-3 h-3"/>Camera Giám Sát</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><span className="text-slate-500">Hiện trạng:</span><p className="font-medium mt-0.5">{r.daCoCamera || "—"}</p></div>
                          <div><span className="text-slate-500">Nhu cầu:</span><div className="mt-0.5">{r.nhuCauCamera ? <Badge className="bg-green-100 text-green-700 text-[10px] py-0">Có</Badge> : <Badge className="bg-slate-100 text-slate-500 text-[10px] py-0">Không</Badge>}</div></div>
                          {r.mucDichCamera && <div className="col-span-2"><span className="text-slate-500">Mục đích:</span><p className="mt-0.5 text-slate-700">{r.mucDichCamera}</p></div>}
                          {r.khuVucCamera && <div className="col-span-2"><span className="text-slate-500">Khu vực:</span><p className="mt-0.5 text-slate-700">{r.khuVucCamera}</p></div>}
                        </div>
                      </div>

                      {/* Kiosk */}
                      <div className="mb-3 bg-purple-50/50 rounded-lg p-3 border border-purple-100">
                        <p className="text-xs font-bold text-purple-700 flex items-center gap-1 mb-2"><MonitorSmartphone className="w-3 h-3"/>Kiosk Tiếp Dân</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><span className="text-slate-500">Hiện trạng:</span><p className="font-medium mt-0.5">{r.daCoKiosk || "—"}</p></div>
                          <div><span className="text-slate-500">Nhu cầu:</span><div className="mt-0.5">{r.nhuCauKiosk ? <Badge className="bg-green-100 text-green-700 text-[10px] py-0">Có</Badge> : <Badge className="bg-slate-100 text-slate-500 text-[10px] py-0">Không</Badge>}</div></div>
                          {r.mucDichKiosk && <div className="col-span-2"><span className="text-slate-500">Mục đích:</span><p className="mt-0.5 text-slate-700">{r.mucDichKiosk}</p></div>}
                        </div>
                      </div>

                      {/* Truyền Thanh */}
                      <div className="mb-3 bg-pink-50/50 rounded-lg p-3 border border-pink-100">
                        <p className="text-xs font-bold text-pink-700 flex items-center gap-1 mb-2"><Radio className="w-3 h-3"/>Truyền Thanh Thông Minh</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div><span className="text-slate-500">Hiện trạng:</span><p className="font-medium mt-0.5">{r.daCoTruyenThanh || "—"}</p></div>
                          <div><span className="text-slate-500">Nhu cầu:</span><div className="mt-0.5">{r.nhuCauTruyenThanh ? <Badge className="bg-green-100 text-green-700 text-[10px] py-0">Có</Badge> : <Badge className="bg-slate-100 text-slate-500 text-[10px] py-0">Không</Badge>}</div></div>
                          {r.mucDichTruyenThanh && <div className="col-span-2"><span className="text-slate-500">Mục đích:</span><p className="mt-0.5 text-slate-700">{r.mucDichTruyenThanh}</p></div>}
                          {r.khuVucTruyenThanh && <div className="col-span-2"><span className="text-slate-500">Khu vực:</span><p className="mt-0.5 text-slate-700">{r.khuVucTruyenThanh}</p></div>}
                        </div>
                      </div>

                      {/* Đề xuất */}
                      {r.deXuatKhac && (
                        <div className="bg-yellow-50/70 rounded-lg p-3 border border-yellow-100">
                          <p className="text-xs font-bold text-yellow-700 flex items-center gap-1 mb-1"><Lightbulb className="w-3 h-3"/>Đề Xuất Khác</p>
                          <p className="text-xs italic text-yellow-800">"{r.deXuatKhac}"</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </>
  );
}
