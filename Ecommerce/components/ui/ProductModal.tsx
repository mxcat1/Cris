"use client"

import { useEffect, useState } from "react"
import styled from "styled-components"
import { FaTimes, FaWhatsapp } from "react-icons/fa"
import { productService } from "@/services/api"
import { IMAGE_BASE_URL } from "@/config/constants"

// Helper para construir URLs de imagen evitando dobles "/storage" y barras
const buildImageUrl = (path?: string) => {
  if (!path) return ""
  if (/^https?:\/\//.test(path)) return path
  const clean = path.replace(/^\/+/, "")
  return clean.startsWith("storage/")
    ? `${IMAGE_BASE_URL}/${clean}`
    : `${IMAGE_BASE_URL}/storage/${clean}`
}

const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: ${({ theme }) => theme.spacing.lg};
  backdrop-filter: blur(5px);
`

const ModalContent = styled.div`
  /* Fondo limpio y claro, sin degradados rosados */
  background: #ffffff;
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(0, 0, 0, 0.08);
  
  &::-webkit-scrollbar {
    width: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.dark};
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.primary};
    border-radius: 4px;
  }
`

const CloseButton = styled.button`
  position: absolute;
  top: ${({ theme }) => theme.spacing.md};
  right: ${({ theme }) => theme.spacing.md};
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: all ${({ theme }) => theme.transitions.fast};
  
  &:hover {
    background: ${({ theme }) => theme.colors.primary};
    transform: rotate(90deg);
  }
`

const ProductDetails = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  
  @media (min-width: ${({ theme }) => theme.breakpoints.md}) {
    grid-template-columns: 1fr 1fr;
  }
`

const ProductImage = styled.div`
  height: 400px;
  /* Fondo suave neutro para la imagen */
  background-color: rgba(0, 0, 0, 0.04);
  
  img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }
`

const ProductInfo = styled.div`
  padding: ${({ theme }) => theme.spacing.xl};
`

const ProductCategory = styled.div`
  color: ${({ theme }) => theme.colors.primary};
  font-size: 0.9rem;
  margin-bottom: ${({ theme }) => theme.spacing.sm};
  font-weight: 500;
`

const ProductName = styled.h2`
  margin-bottom: ${({ theme }) => theme.spacing.md};
  font-size: 1.8rem;
`

const ProductPrice = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: ${({ theme }) => theme.spacing.lg};
  
  .original {
    color: ${({ theme }) => theme.colors.textSecondary};
    text-decoration: line-through;
    margin-right: ${({ theme }) => theme.spacing.md};
    font-size: 1.2rem;
  }
  
  .sale {
    color: ${({ theme }) => theme.colors.primary};
    font-weight: 600;
    font-size: 2rem;
  }
`

const ProductDescription = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing.xl};
  color: ${({ theme }) => theme.colors.textSecondary};
  line-height: 1.6;
`

const ActionButtons = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.md};
  margin-top: ${({ theme }) => theme.spacing.xl};
  flex-wrap: wrap;
`

interface ActionButtonProps {
  primary?: boolean;
}

const ActionButton = styled.a<ActionButtonProps>`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing.md} ${({ theme }) => theme.spacing.xl};
  background: ${({ theme, primary }) => (primary ? theme.colors.primary : "transparent")};
  color: ${({ theme }) => theme.colors.textPrimary};
  border: ${({ theme, primary }) => (primary ? "none" : `1px solid ${theme.colors.border}`)};
  border-radius: ${({ theme }) => theme.borderRadius.medium};
  font-weight: 600;
  cursor: pointer;
  transition: all ${({ theme }) => theme.transitions.fast};
  text-decoration: none;
  
  &:hover {
    /* Evitamos el rojo/rosa en hover; usamos la marca sutilmente */
    background: ${({ theme, primary }) => (primary ? theme.colors.primary : "rgba(0, 0, 0, 0.06)")};
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
    filter: ${({ primary }) => (primary ? "brightness(0.95)" : "none")};
  }
  
  svg {
    margin-right: ${({ theme }) => theme.spacing.sm};
  }
`

interface ProductModalProps {
  productId: number;
  onClose: () => void;
}

const ProductModal = ({ productId, onClose }: ProductModalProps) => {
  const [product, setProduct] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await productService.getById(productId)
        const productData = response.data.data || response.data
        setProduct(productData)
        setLoading(false)
      } catch (error) {
        console.error("Error al cargar producto:", error)
        setLoading(false)
      }
    }

    if (productId) {
      fetchProduct()
    }
  }, [productId])

  // Función para generar el mensaje de WhatsApp
  const generateWhatsAppMessage = () => {
    if (!product) return ""
    const message = `Hola, estoy interesado en el producto "${product.name}" que vi en Globival & Detalles. ¿Podrías darme más información?`
    return `https://wa.me/51967411110?text=${encodeURIComponent(message)}`
  }

  // Cerrar el modal al hacer clic en el overlay
  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Cerrar el modal al presionar Escape
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", handleEscKey)
    return () => window.removeEventListener("keydown", handleEscKey)
  }, [onClose])

  if (loading) {
    return (
      <ModalOverlay onClick={handleOverlayClick}>
        <ModalContent>
          <CloseButton onClick={onClose}>
            <FaTimes />
          </CloseButton>
          <div style={{ padding: "2rem", textAlign: "center" }}>Cargando producto...</div>
        </ModalContent>
      </ModalOverlay>
    )
  }

  if (!product) {
    return (
      <ModalOverlay onClick={handleOverlayClick}>
        <ModalContent>
          <CloseButton onClick={onClose}>
            <FaTimes />
          </CloseButton>
          <div style={{ padding: "2rem", textAlign: "center" }}>Producto no encontrado</div>
        </ModalContent>
      </ModalOverlay>
    )
  }

  return (
    <ModalOverlay onClick={handleOverlayClick}>
      <ModalContent>
        <CloseButton onClick={onClose}>
          <FaTimes />
        </CloseButton>

        <ProductDetails>
          <ProductImage>
            <img
              src={
                buildImageUrl(product.imagen) || "/images/product-placeholder.jpg"
              }
              alt={product.name}
            />
          </ProductImage>

          <ProductInfo>
            <ProductCategory>{product.subCategory?.name || "Categoría"}</ProductCategory>
            <ProductName>{product.name}</ProductName>
            <ProductPrice>
              {product.precio_de_oferta ? (
                <>
                  <span className="original">S/ {product.price}</span>
                  <span className="sale">S/ {product.precio_de_oferta}</span>
                </>
              ) : (
                <span className="sale">S/ {product.price}</span>
              )}
            </ProductPrice>

            <ProductDescription>
              <p>{product.description || "Sin descripción disponible."}</p>
            </ProductDescription>

            <ActionButtons>
              <ActionButton href={`/producto/${product.id}`}>Ver detalle completo</ActionButton>
              <ActionButton href={generateWhatsAppMessage()} target="_blank" rel="noopener noreferrer" primary={true}>
                <FaWhatsapp /> Contactar
              </ActionButton>
            </ActionButtons>
          </ProductInfo>
        </ProductDetails>
      </ModalContent>
    </ModalOverlay>
  )
}

export default ProductModal
