'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  FileText,
  Upload,
  MoreVertical,
  Download,
  Trash2,
  Star,
  StarOff,
  File,
  Loader2,
  Plus,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Document {
  id: string;
  name: string;
  filename: string;
  mimeType: string;
  size: number;
  version: string | null;
  isDefault: boolean;
  type: 'CV' | 'COVER_LETTER' | 'PORTFOLIO' | 'OTHER';
  createdAt: string;
  updatedAt: string;
}

const TYPE_LABELS: Record<string, string> = {
  CV: 'CV / Resume',
  COVER_LETTER: 'Cover Letter',
  PORTFOLIO: 'Portfolio',
  OTHER: 'Other',
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function DocumentsPage() {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  
  // Upload form state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentName, setDocumentName] = useState('');
  const [documentVersion, setDocumentVersion] = useState('');
  const [documentType, setDocumentType] = useState<string>('CV');

  useEffect(() => {
    fetchDocuments();
  }, [filterType]);

  async function fetchDocuments() {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterType !== 'all') {
        params.set('type', filterType);
      }
      const response = await fetch(`/api/documents?${params.toString()}`);
      const data = await response.json();
      if (data.success) {
        setDocuments(data.data.documents);
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error);
      toast({
        title: 'Error',
        description: 'Failed to load documents',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleUpload() {
    if (!selectedFile) {
      toast({
        title: 'Error',
        description: 'Please select a file',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('name', documentName || selectedFile.name);
      formData.append('type', documentType);
      if (documentVersion) {
        formData.append('version', documentVersion);
      }

      const response = await fetch('/api/documents', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (data.success) {
        toast({
          title: 'Success',
          description: 'Document uploaded successfully',
        });
        setUploadDialogOpen(false);
        resetUploadForm();
        fetchDocuments();
      } else {
        toast({
          title: 'Error',
          description: data.error?.message || 'Failed to upload document',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload document',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  }

  function resetUploadForm() {
    setSelectedFile(null);
    setDocumentName('');
    setDocumentVersion('');
    setDocumentType('CV');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }

  async function handleSetDefault(documentId: string) {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isDefault: true }),
      });

      const data = await response.json();
      if (data.success) {
        toast({ title: 'Default CV updated' });
        fetchDocuments();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update default',
        variant: 'destructive',
      });
    }
  }

  async function handleDelete(documentId: string) {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        toast({ title: 'Document deleted' });
        fetchDocuments();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete document',
        variant: 'destructive',
      });
    }
  }

  const cvDocuments = documents.filter(d => d.type === 'CV');
  const otherDocuments = documents.filter(d => d.type !== 'CV');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Documents</h1>
          <p className="text-muted-foreground">
            Manage your CVs and other documents
          </p>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Upload className="mr-2 h-4 w-4" />
              Upload Document
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Document</DialogTitle>
              <DialogDescription>
                Upload a CV, cover letter, or other document. Supported formats: PDF, DOCX.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="file">File</Label>
                <Input
                  ref={fileInputRef}
                  id="file"
                  type="file"
                  accept=".pdf,.docx,.doc"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFile(file);
                      if (!documentName) {
                        setDocumentName(file.name.replace(/\.[^/.]+$/, ''));
                      }
                    }
                  }}
                />
                {selectedFile && (
                  <p className="text-sm text-muted-foreground">
                    {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  placeholder="My Resume"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Document Type</Label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CV">CV / Resume</SelectItem>
                    <SelectItem value="COVER_LETTER">Cover Letter</SelectItem>
                    <SelectItem value="PORTFOLIO">Portfolio</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="version">Version Label (optional)</Label>
                <Input
                  id="version"
                  placeholder="e.g., Technical, Creative, v2"
                  value={documentVersion}
                  onChange={(e) => setDocumentVersion(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleUpload} disabled={!selectedFile || uploading}>
                {uploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Upload
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Documents</SelectItem>
            <SelectItem value="CV">CVs / Resumes</SelectItem>
            <SelectItem value="COVER_LETTER">Cover Letters</SelectItem>
            <SelectItem value="PORTFOLIO">Portfolios</SelectItem>
            <SelectItem value="OTHER">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : documents.length === 0 ? (
        /* Empty State */
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No documents yet</h3>
            <p className="mt-2 text-sm text-muted-foreground text-center max-w-sm">
              Upload your CV and other documents to use them when applying for jobs.
            </p>
            <Button className="mt-4" onClick={() => setUploadDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Upload Your First Document
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* CV Section */}
          {cvDocuments.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">CVs / Resumes</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {cvDocuments.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    onSetDefault={handleSetDefault}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Other Documents Section */}
          {otherDocuments.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-4">Other Documents</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {otherDocuments.map((doc) => (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    onSetDefault={handleSetDefault}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DocumentCard({
  document,
  onSetDefault,
  onDelete,
}: {
  document: Document;
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const isPDF = document.mimeType === 'application/pdf';

  return (
    <Card className={document.isDefault ? 'ring-2 ring-primary' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isPDF ? 'bg-red-100' : 'bg-blue-100'}`}>
              <File className={`h-5 w-5 ${isPDF ? 'text-red-600' : 'text-blue-600'}`} />
            </div>
            <div>
              <CardTitle className="text-base">{document.name}</CardTitle>
              <CardDescription className="text-xs">
                {TYPE_LABELS[document.type]}
                {document.version && ` • ${document.version}`}
              </CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Download className="mr-2 h-4 w-4" />
                Download
              </DropdownMenuItem>
              {document.type === 'CV' && !document.isDefault && (
                <DropdownMenuItem onClick={() => onSetDefault(document.id)}>
                  <Star className="mr-2 h-4 w-4" />
                  Set as Default
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    className="text-red-600"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Document</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{document.name}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => onDelete(document.id)}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{formatFileSize(document.size)}</span>
          <span>{formatDate(document.createdAt)}</span>
        </div>
        {document.isDefault && (
          <Badge variant="default" className="mt-3">
            <Star className="mr-1 h-3 w-3" />
            Default
          </Badge>
        )}
      </CardContent>
    </Card>
  );
}
