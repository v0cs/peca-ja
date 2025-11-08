import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";
import { cn } from "../../lib/utils";

const ImageUpload = ({ images = [], onChange, maxImages = 3, error }) => {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);
  const inputId = `file-input-${Math.random().toString(36).substr(2, 9)}`;

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFiles = (files) => {
    // Tipos de arquivo permitidos (deve corresponder ao backend)
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp"];

    const validFiles = Array.from(files).filter((file) => {
      // Validar tipo MIME
      if (!allowedTypes.includes(file.type)) {
        alert(`${file.name}: Tipo de arquivo não permitido. Use apenas JPEG, PNG ou WebP.`);
        return false;
      }

      // Validar extensão do arquivo (validação adicional)
      const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf("."));
      if (!allowedExtensions.includes(fileExtension)) {
        alert(`${file.name}: Extensão não permitida. Use apenas .jpg, .jpeg, .png ou .webp.`);
        return false;
      }

      // Validar tamanho (máx 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} é muito grande. Máximo 5MB por imagem`);
        return false;
      }

      return true;
    });

    // Limitar quantidade
    const remainingSlots = maxImages - images.length;
    const filesToAdd = validFiles.slice(0, remainingSlots);

    if (validFiles.length > remainingSlots) {
      alert(`Você pode adicionar apenas ${remainingSlots} imagem(ns) mais`);
    }

    if (filesToAdd.length > 0) {
      const newImages = [...images, ...filesToAdd];
      onChange(newImages);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(Array.from(e.target.files));
    }
    // Limpar input para permitir selecionar o mesmo arquivo novamente
    if (e.target) {
      e.target.value = "";
    }
  };

  const handleClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium">
        Imagens da Peça {images.length > 0 && `(${images.length}/${maxImages})`}
      </label>

      {/* Área de Upload */}
      {canAddMore && (
        <label
          htmlFor={inputId}
          className={cn(
            "block border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer",
            dragActive
              ? "border-primary bg-primary/5"
              : "border-input hover:border-primary/50",
            error ? "border-destructive" : ""
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={(e) => {
            // Evitar cliques duplos, mas permitir que o label funcione
            e.stopPropagation();
          }}
        >
          <input
            ref={fileInputRef}
            id={inputId}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple={maxImages > 1}
            onChange={handleFileInput}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-2 pointer-events-none">
            <Upload className="h-10 w-10 text-muted-foreground" />
            <div className="text-sm">
              <span className="font-medium text-primary">Clique para upload</span> ou arraste
              imagens aqui
            </div>
            <p className="text-xs text-muted-foreground">
              PNG, JPG até 5MB. Máximo {maxImages} imagem(ns)
            </p>
          </div>
        </label>
      )}

      {/* Preview das Imagens */}
      {images.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image, index) => {
            const url = typeof image === "string" ? image : URL.createObjectURL(image);

            return (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg border border-input overflow-hidden bg-muted">
                  <img
                    src={url}
                    alt={`Imagem ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    removeImage(index);
                  }}
                  className="absolute top-2 right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                  title="Remover imagem"
                >
                  <X className="h-4 w-4" />
                </button>
                {typeof image !== "string" && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {image.name}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {!canAddMore && (
        <p className="text-sm text-muted-foreground">
          Limite de {maxImages} imagem(ns) atingido. Remova uma imagem para adicionar outra.
        </p>
      )}
    </div>
  );
};

export default ImageUpload;
