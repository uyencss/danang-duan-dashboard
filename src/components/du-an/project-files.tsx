import { Card, CardContent } from "@/components/ui/card";
import { 
    FileText, 
    Image as ImageIcon, 
    FileSpreadsheet, 
    FileArchive, 
    FileCode, 
    File, 
    Download 
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface ProjectFilesProps {
    files: Array<{
        id: number;
        name: string;
        type: string;
        size: number;
        url: string;
        createdAt: Date | string;
        log?: {
            user?: {
                name: string;
            }
        }
    }>;
}

export function ProjectFiles({ files }: ProjectFilesProps) {
    const getFileIcon = (type: string, name: string) => {
        if (type.startsWith("image/")) return <ImageIcon className="size-5 text-blue-500" />;
        if (type.includes("pdf")) return <FileText className="size-5 text-red-500" />;
        if (type.includes("spreadsheet") || type.includes("excel") || type.includes("csv")) return <FileSpreadsheet className="size-5 text-green-600" />;
        if (type.includes("zip") || type.includes("rar") || type.includes("tar")) return <FileArchive className="size-5 text-yellow-600" />;
        if (type.includes("json") || type.includes("xml") || type.includes("javascript")) return <FileCode className="size-5 text-slate-600" />;
        if (type.includes("word") || type.includes("document")) return <FileText className="size-5 text-blue-700" />;
        return <File className="size-5 text-slate-400" />;
    };

    if (!files || files.length === 0) {
        return (
            <Card className="border-[#c5c6ce]/10 shadow-sm rounded-xl overflow-hidden bg-slate-50/50">
                <CardContent className="p-12 flex flex-col items-center justify-center text-center">
                    <div className="p-4 bg-white rounded-full shadow-sm mb-4 border border-slate-100">
                        <File className="size-8 text-slate-300" />
                    </div>
                    <p className="text-sm font-bold text-slate-600">Không có tài liệu đính kèm</p>
                    <p className="text-xs text-slate-400 mt-1">Các tệp đính kèm trong nhật ký sẽ hiển thị ở đây</p>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {files.map((file) => (
                <a 
                    key={file.id} 
                    href={`/api/uploads/${file.url || (file as any).filePath?.replace('/uploads/', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={file.name}
                    className="group"
                >
                    <Card className="border-slate-200/60 shadow-sm rounded-xl overflow-hidden hover:border-blue-300 hover:shadow-md transition-all h-full bg-white relative">
                        <CardContent className="p-4 flex items-center justify-between gap-4 h-full">
                            <div className="flex items-center gap-4 min-w-0 flex-1">
                                <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl shrink-0 group-hover:scale-105 transition-transform">
                                    {getFileIcon(file.type, file.name)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-bold text-sm text-slate-700 truncate group-hover:text-blue-600 transition-colors" title={file.name}>
                                        {file.name}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1 text-[11px] font-medium text-slate-400">
                                        <span className="uppercase tracking-widest">{formatBytes(file.size)}</span>
                                        <span>•</span>
                                        <span>{format(new Date(file.createdAt), "dd/MM/yyyy HH:mm")}</span>
                                        {file.log?.user?.name && (
                                            <>
                                                <span>•</span>
                                                <span className="truncate">{file.log.user.name}</span>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="p-2 rounded-full hover:bg-slate-100 text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors shrink-0">
                                <Download className="size-4" />
                            </div>
                        </CardContent>
                    </Card>
                </a>
            ))}
        </div>
    );
}

export function formatBytes(bytes: number, decimals = 2) {
    if (!+bytes) return '0 Bytes'
    const k = 1024
    const dm = decimals < 0 ? 0 : decimals
    const sizes = ['Bytes', 'KiB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}
