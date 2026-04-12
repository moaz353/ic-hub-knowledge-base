import { Eye, Download, X } from 'lucide-react';
import { isImageFile, isPdfFile, isUploadedFile } from '@/services/fileUpload';
import { useState } from 'react';

interface FileActionButtonsProps {
  fileUrl: string;
  topicColor: string;
}

export default function FileActionButtons({ fileUrl, topicColor }: FileActionButtonsProps) {
  const [previewOpen, setPreviewOpen] = useState(false);

  // Only show for uploaded files, not external links
  if (!isUploadedFile(fileUrl)) return null;

  const handleDownload = async () => {
    try {
      const res = await fetch(fileUrl);
      const blob = await res.blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      const name = fileUrl.split('/').pop() || 'download';
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(a.href);
    } catch {
      window.open(fileUrl, '_blank');
    }
  };

  const canPreview = isImageFile(fileUrl) || isPdfFile(fileUrl);

  return (
    <>
      <div className="flex items-center gap-1">
        {canPreview && (
          <button
            onClick={() => setPreviewOpen(!previewOpen)}
            title="Inline preview"
            className="rounded-md border border-border p-1.5 text-muted-foreground transition-all hover:text-foreground hover:border-foreground/30 hover:shadow-sm"
            style={previewOpen ? { color: topicColor, borderColor: `${topicColor}60` } : {}}
          >
            <Eye size={14} />
          </button>
        )}
        <button
          onClick={handleDownload}
          title="Download"
          className="rounded-md border border-border p-1.5 text-muted-foreground transition-all hover:text-foreground hover:border-foreground/30 hover:shadow-sm"
        >
          <Download size={14} />
        </button>
      </div>

      {previewOpen && (
        <div className="relative mt-2 overflow-hidden rounded-lg border border-border bg-secondary/50">
          <button
            onClick={() => setPreviewOpen(false)}
            className="absolute right-2 top-2 z-10 rounded-full bg-card/80 p-1 text-muted-foreground hover:text-foreground backdrop-blur-sm"
          >
            <X size={14} />
          </button>
          {isImageFile(fileUrl) ? (
            <img src={fileUrl} alt="Preview" className="max-h-80 w-full object-contain" />
          ) : isPdfFile(fileUrl) ? (
            <iframe src={fileUrl} title="PDF Preview" className="h-80 w-full" />
          ) : null}
        </div>
      )}
    </>
  );
}
