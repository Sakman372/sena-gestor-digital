import { useState } from "react";
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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Document {
  id: string;
  name: string;
  type: "pdf" | "doc" | "image" | "other";
  size: string;
  date: string;
  category: string;
}

const documents: Document[] = [
  { id: "1", name: "Certificado_Academico_2024.pdf", type: "pdf", size: "245 KB", date: "15/12/2024", category: "Certificados" },
  { id: "2", name: "Constancia_Matricula.pdf", type: "pdf", size: "180 KB", date: "14/12/2024", category: "Constancias" },
  { id: "3", name: "Foto_Carnet.jpg", type: "image", size: "1.2 MB", date: "10/12/2024", category: "Documentos Personales" },
  { id: "4", name: "Carta_Recomendacion.docx", type: "doc", size: "56 KB", date: "08/12/2024", category: "Cartas" },
  { id: "5", name: "Notas_Semestre_2024-2.pdf", type: "pdf", size: "320 KB", date: "05/12/2024", category: "Certificados" },
  { id: "6", name: "Acta_Grado.pdf", type: "pdf", size: "890 KB", date: "01/12/2024", category: "Certificados" },
];

const categories = ["Todos", "Certificados", "Constancias", "Cartas", "Documentos Personales"];

const getFileIcon = (type: Document["type"]) => {
  switch (type) {
    case "pdf":
      return <FileText className="w-6 h-6 text-destructive" />;
    case "doc":
      return <File className="w-6 h-6 text-info" />;
    case "image":
      return <Image className="w-6 h-6 text-success" />;
    default:
      return <File className="w-6 h-6 text-muted-foreground" />;
  }
};

export default function Documents() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Todos");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isDragging, setIsDragging] = useState(false);

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "Todos" || doc.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
          <button className="btn-sena flex items-center gap-2 self-start">
            <Upload className="w-5 h-5" />
            Subir Documento
          </button>
        </div>

        {/* Upload Area */}
        <div
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200",
            isDragging
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50 hover:bg-muted/30"
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={() => setIsDragging(false)}
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
          <button className="btn-sena-outline text-sm">
            Seleccionar Archivos
          </button>
          <p className="text-xs text-muted-foreground mt-3">
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
              {categories.map((category) => (
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
                    {getFileIcon(doc.type)}
                  </div>
                  <button className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-muted transition-all">
                    <MoreVertical className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
                <h3 className="font-medium text-foreground text-sm truncate mb-1" title={doc.name}>
                  {doc.name}
                </h3>
                <p className="text-xs text-muted-foreground mb-3">
                  {doc.size} • {doc.date}
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-muted text-muted-foreground px-2 py-1 rounded">
                    {doc.category}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="flex-1 p-2 text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 rounded transition-colors flex items-center justify-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    Ver
                  </button>
                  <button className="flex-1 p-2 text-xs text-muted-foreground hover:text-primary hover:bg-primary/5 rounded transition-colors flex items-center justify-center gap-1">
                    <Download className="w-3.5 h-3.5" />
                    Descargar
                  </button>
                  <button className="p-2 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded transition-colors">
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
                    {getFileIcon(doc.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground text-sm truncate">{doc.name}</h3>
                    <p className="text-xs text-muted-foreground">
                      {doc.category} • {doc.size} • {doc.date}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button className="p-2 hover:bg-muted rounded-lg transition-colors" title="Ver">
                      <Eye className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button className="p-2 hover:bg-muted rounded-lg transition-colors" title="Descargar">
                      <Download className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button className="p-2 hover:bg-destructive/10 rounded-lg transition-colors" title="Eliminar">
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
            <button className="btn-sena-outline">
              Subir primer documento
            </button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
