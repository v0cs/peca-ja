import { useState } from "react";
import { X, ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import { cn } from "../../lib/utils";

const ImageGallery = ({ images = [] }) => {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [imageErrors, setImageErrors] = useState({});

  if (!images || images.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>Nenhuma imagem disponível</p>
      </div>
    );
  }

  const openLightbox = (index) => {
    setSelectedIndex(index);
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
  };

  const nextImage = () => {
    setSelectedIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setSelectedIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // Construir URL da imagem (pode ser URL completa ou relativa)
  const getImageUrl = (image) => {
    // Se for objeto com propriedade url (formato retornado pelo backend)
    if (image && typeof image === "object") {
      // Se já tiver URL formatada
      if (image.url) {
        if (image.url.startsWith("http")) {
          return image.url;
        }
        // Path relativo do backend: /uploads/filename.jpg
        const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3001";
        const cleanBaseURL = baseURL.replace("/api", "");
        const finalUrl = `${cleanBaseURL}${image.url}`;
        console.log(`🖼️ [ImageGallery] Construindo URL:`, {
          originalUrl: image.url,
          baseURL,
          cleanBaseURL,
          finalUrl,
        });
        return finalUrl;
      }
      
      // Se tiver nome_arquivo_fisico, construir URL
      if (image.nome_arquivo_fisico) {
        const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3001";
        const cleanBaseURL = baseURL.replace("/api", "");
        const finalUrl = `${cleanBaseURL}/uploads/${image.nome_arquivo_fisico}`;
        console.log(`🖼️ [ImageGallery] Construindo URL a partir de nome_arquivo_fisico:`, {
          nome_arquivo_fisico: image.nome_arquivo_fisico,
          baseURL,
          cleanBaseURL,
          finalUrl,
        });
        return finalUrl;
      }
    }
    
    // Se for string, pode ser URL completa ou path relativo
    if (typeof image === "string") {
      if (image.startsWith("http")) {
        return image;
      }
      // Path relativo: /uploads/filename.jpg
      const baseURL = import.meta.env.VITE_API_URL || "http://localhost:3001";
      const cleanBaseURL = baseURL.replace("/api", "");
      const finalUrl = `${cleanBaseURL}${image.startsWith("/") ? image : `/${image}`}`;
      console.log(`🖼️ [ImageGallery] Construindo URL a partir de string:`, {
        image,
        baseURL,
        cleanBaseURL,
        finalUrl,
      });
      return finalUrl;
    }
    
    // Fallback: se for File object (preview)
    if (image instanceof File) {
      return URL.createObjectURL(image);
    }
    
    console.warn(`🖼️ [ImageGallery] Não foi possível construir URL para:`, image);
    return "";
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {images.map((image, index) => {
          const imageUrl = getImageUrl(image);
          const hasError = imageErrors[index];

          const handleImageError = () => {
            setImageErrors((prev) => ({ ...prev, [index]: true }));
          };

          return (
            <div
              key={index}
              className="relative aspect-square rounded-lg border border-input overflow-hidden bg-muted cursor-pointer group"
              onClick={() => !hasError && openLightbox(index)}
            >
              {hasError ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mb-2" />
                  <p className="text-xs text-center px-2">Erro ao carregar imagem</p>
                </div>
              ) : (
                <>
                  <img
                    src={imageUrl}
                    alt={`Imagem ${index + 1}`}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    onError={handleImageError}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Lightbox */}
      {selectedIndex !== null && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 text-white hover:text-gray-300 z-10"
          >
            <X className="h-8 w-8" />
          </button>

          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-4 text-white hover:text-gray-300 z-10"
              >
                <ChevronLeft className="h-8 w-8" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-4 text-white hover:text-gray-300 z-10"
              >
                <ChevronRight className="h-8 w-8" />
              </button>
            </>
          )}

          <div className="max-w-7xl max-h-full p-4" onClick={(e) => e.stopPropagation()}>
            {imageErrors[selectedIndex] ? (
              <div className="flex flex-col items-center justify-center text-white">
                <ImageIcon className="h-16 w-16 mb-4" />
                <p className="text-lg">Erro ao carregar imagem</p>
              </div>
            ) : (
              <img
                src={getImageUrl(images[selectedIndex])}
                alt={`Imagem ${selectedIndex + 1}`}
                className="max-w-full max-h-[90vh] object-contain"
                onError={() => setImageErrors((prev) => ({ ...prev, [selectedIndex]: true }))}
              />
            )}
            {images.length > 1 && (
              <p className="text-white text-center mt-4">
                {selectedIndex + 1} / {images.length}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ImageGallery;

