import { useState, useEffect, useRef } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Search,
  Upload,
  FolderOpen,
  File,
  FileText,
  Image,
  MoreVertical,
  Download,
  Eye,
  Trash2,
  Grid,
  List,
  Loader2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Document {
  id: string;
  nombre: string;
  descripcion: string | null;
  archivo_url: string;
  tipo_mime: string | null;
  tamano_bytes: number | null;
  category_id: string | null;
  user_id: string;
  created_at: string;
  category?: {
    nombre: string;
  };
}

interface DocumentCategory {
  id: string;
  nombre: string;
  descripcion: string | null;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const getFileIcon = (mimeType: string | null) => {
  if (!mimeType) return <File className="w-6 h-6 text-muted-foreground" />;
  
  if (mimeType.includes('pdf')) {
    return <FileText className="w-6 h-6 text-destructive" />;
  }
  if (mimeType.includes('word') || mimeType.includes('document')) {
    return <File className="w-6 h-6 text-info" />;
  }
  if (mimeType.includes('image')) {
    return <Image className="w-6 h-6 text-success" />;
  }
  return <File className="w-6 h-6 text-muted-foreground" />;
};

const formatFileSize = (bytes: number | null) => {
  if (!bytes) return 'N/A';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function Documents() {
  const { user, role } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isDragging, setIsDragging] = useState(false);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<DocumentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  // Upload dialog state
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadName, setUploadName] = useState("");
  const [uploadDescription, setUploadDescription] = useState("");
  const [uploadCategoryId, setUploadCategoryId] = useState("");
  
  // Delete confirmation
  const [deleteDocId, setDeleteDocId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const isStaff = role === 'admin' || role === 'funcionario';

  useEffect(() => {
    fetchDocuments();
    fetchCategories();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select(`
          *,
          document_categories (nombre)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching documents:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los documentos",
          variant: "destructive",
        });
        return;
      }

      setDocuments(data?.map(doc => ({
        ...doc,
        category: doc.document_categories,
      })) || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('document_categories')
      .select('*')
      .order('nombre');

    if (!error && data) {
      setCategories(data);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "Archivo muy grande",
        description: "El archivo no puede superar los 10MB",
        variant: "destructive",
      });
      return;
    }

    setUploadFile(file);
    setUploadName(file.name.replace(/\.[^/.]+$/, ""));
    setIsUploadDialogOpen(true);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const handleUpload = async () => {
    if (!uploadFile || !user) {
      toast({
        title: "Error",
        description: "Selecciona un archivo para subir",
        variant: "destructive",
      });
      return;
    }

    if (!uploadName.trim()) {
      toast({
        title: "Error",
        description: "El nombre del documento es requerido",
        variant: "destructive",
      });
      return;
    }

    try {
      setUploading(true);

      // Upload file to storage
      const fileExt = uploadFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, uploadFile);

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast({
          title: "Error al subir archivo",
          description: uploadError.message,
          variant: "destructive",
        });
        return;
      }

      // Create document record
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          nombre: uploadName.trim(),
          descripcion: uploadDescription.trim() || null,
          archivo_url: fileName,
          tipo_mime: uploadFile.type,
          tamano_bytes: uploadFile.size,
          category_id: uploadCategoryId || null,
          user_id: user.id,
        });

      if (dbError) {
        console.error('Database error:', dbError);
        // Try to delete uploaded file
        await supabase.storage.from('documents').remove([fileName]);
        
        toast({
          title: "Error",
          description: dbError.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Documento subido",
        description: "El documento se ha subido exitosamente",
      });

      // Reset and close
      setIsUploadDialogOpen(false);
      setUploadFile(null);
      setUploadName("");
      setUploadDescription("");
      setUploadCategoryId("");
      fetchDocuments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al subir el documento",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDocId) return;

    const doc = documents.find(d => d.id === deleteDocId);
    if (!doc) return;

    try {
      setDeleting(true);

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('documents')
        .remove([doc.archivo_url]);

      if (storageError) {
        console.error('Storage delete error:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('documents')
        .delete()
        .eq('id', deleteDocId);

      if (dbError) {
        toast({
          title: "Error",
          description: dbError.message,
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Documento eliminado",
        description: "El documento se ha eliminado exitosamente",
      });

      setDeleteDocId(null);
      fetchDocuments();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error al eliminar",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleDownload = async (doc: Document) => {
    const { data, error } = await supabase.storage
      .from('documents')
      .download(doc.archivo_url);

    if (error) {
      toast({
        title: "Error",
        description: "No se pudo descargar el documento",
        variant: "destructive",
      });
      return;
    }

    const url = URL.createObjectURL(data);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.nombre + '.' + doc.archivo_url.split('.').pop();
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleView = async (doc: Document) => {
    const { data } = supabase.storage.from('documents').getPublicUrl(doc.archivo_url);
    window.open(data.publicUrl, '_blank');
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.nombre.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "Todos" || doc.category?.nombre === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const categoryNames = ["Todos", ...categories.map(c => c.nombre)];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mis Documentos</h1>
            <p className="text-muted-foreground mt-1">
              Gestiona tus documentos y archivos
            </p>
          </div>
          <button 
            onClick={() => fileInputRef.current?.click()}
            className="btn-sena flex items-center gap-2 self-start"
          >
            <Upload className="w-5 h-5" />
            Subir Documento
          </button>
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => handleFileSelect(e.target.files)}
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
          />
        </div>

        {/* Upload Area */}
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200 cursor-pointer",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/30"
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Upload className="w-8 h-8 text-primary" />
          </div>
          <p className="text-foreground font-medium mb-1">
            Arrastra y suelta archivos aquí
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            o haz clic para seleccionar archivos
          </p>
          <p className="text-xs text-muted-foreground">
            Formatos permitidos: PDF, DOC, DOCX, JPG, PNG (máx. 10MB)
          </p>
        </div>

        {/* Filters & Search */}
        <div className="bg-card rounded-lg border border-border shadow-card p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Buscar documentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-sena pl-10"
                />
              </div>
            </div>

            {/* Categories */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
              {categoryNames.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                    selectedCategory === category
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/70"
                  )}
                >
                  {category}
                </button>
              ))}
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-1 border border-border rounded-lg p-1">
              <button
                onClick={() => setViewMode("grid")}
                className={cn(
                  "p-2 rounded transition-colors",
                  viewMode === "grid" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                )}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={cn(
                  "p-2 rounded transition-colors",
                  viewMode === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                )}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {/* Documents Grid/List */}
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredDocuments.map((doc, index) => (
                  <div
                    key={doc.id}
                    className="bg-card rounded-lg border border-border shadow-card p-4 hover:shadow-card-hover transition-all duration-200 group animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms`, animationFillMode: "backwards" }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-muted rounded-lg flex items-center justify-center">
                        {getFileIcon(doc.tipo_mime)}
                      </div>
                    </div>
                    <h3 className="font-medium text-foreground text-sm truncate mb-1" title={doc.nombre}>
                      {doc.nombre}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      {formatFileSize(doc.tamano_bytes)} • {formatDate(doc.created_at)}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                        {doc.category?.nombre || 'Sin categoría'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => handleView(doc)}
                        className="flex-1 p-2 text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 rounded transition-colors flex items-center justify-center gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Ver
                      </button>
                      <button 
                        onClick={() => handleDownload(doc)}
                        className="flex-1 p-2 text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 rounded transition-colors flex items-center justify-center gap-1"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Descargar
                      </button>
                      <button 
                        onClick={() => setDeleteDocId(doc.id)}
                        className="p-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-card rounded-lg border border-border shadow-card overflow-hidden">
                <div className="divide-y divide-border">
                  {filteredDocuments.map((doc, index) => (
                    <div
                      key={doc.id}
                      className="p-4 hover:bg-muted/30 transition-colors flex items-center gap-4 animate-fade-in"
                      style={{ animationDelay: `${index * 50}ms`, animationFillMode: "backwards" }}
                    >
                      <div className="w-10 h-10 bg-muted rounded-lg flex items-center justify-center flex-shrink-0">
                        {getFileIcon(doc.tipo_mime)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground text-sm truncate">{doc.nombre}</h3>
                        <p className="text-xs text-muted-foreground">
                          {doc.category?.nombre || 'Sin categoría'} • {formatFileSize(doc.tamano_bytes)} • {formatDate(doc.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => handleView(doc)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors" 
                          title="Ver"
                        >
                          <Eye className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button 
                          onClick={() => handleDownload(doc)}
                          className="p-2 hover:bg-muted rounded-lg transition-colors" 
                          title="Descargar"
                        >
                          <Download className="w-4 h-4 text-muted-foreground" />
                        </button>
                        <button 
                          onClick={() => setDeleteDocId(doc.id)}
                          className="p-2 hover:bg-destructive/10 rounded-lg transition-colors" 
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {filteredDocuments.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <FolderOpen className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-1">No se encontraron documentos</h3>
                <p className="text-muted-foreground mb-4">
                  No hay documentos que coincidan con tu búsqueda
                </p>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="btn-sena-outline"
                >
                  Subir primer documento
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Subir Documento</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {uploadFile && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                {getFileIcon(uploadFile.type)}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{uploadFile.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(uploadFile.size)}</p>
                </div>
                <button 
                  onClick={() => setUploadFile(null)}
                  className="p-1 hover:bg-muted rounded"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Nombre del documento *
              </label>
              <input
                type="text"
                value={uploadName}
                onChange={(e) => setUploadName(e.target.value)}
                className="input-sena"
                placeholder="Nombre del documento"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Descripción (opcional)
              </label>
              <textarea
                value={uploadDescription}
                onChange={(e) => setUploadDescription(e.target.value)}
                className="input-sena min-h-[80px] resize-none"
                placeholder="Descripción del documento..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">
                Categoría
              </label>
              <select
                value={uploadCategoryId}
                onChange={(e) => setUploadCategoryId(e.target.value)}
                className="input-sena"
              >
                <option value="">Sin categoría</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.nombre}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => {
                  setIsUploadDialogOpen(false);
                  setUploadFile(null);
                  setUploadName("");
                  setUploadDescription("");
                  setUploadCategoryId("");
                }}
                className="btn-sena-outline flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading || !uploadFile}
                className="btn-sena flex-1 flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Subiendo...
                  </>
                ) : (
                  "Subir Documento"
                )}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDocId} onOpenChange={() => setDeleteDocId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar documento?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. El documento será eliminado permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}
