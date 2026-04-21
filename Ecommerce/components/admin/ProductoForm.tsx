"use client"

import { useState, useEffect } from "react"
import { useFormik } from "formik"
import { motion, AnimatePresence } from "framer-motion"
import * as Yup from "yup"
import { FaImage, FaTag, FaDollarSign, FaBoxOpen, FaAlignLeft, FaLayerGroup, FaTimes, FaPlus } from "react-icons/fa"
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

interface ProductImage {
  id: number;
  image_path: string;
  order: number;
}

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  precio_de_oferta?: number;
  stock: number;
  imagen?: string;
  images?: ProductImage[];
  category?: {
    id: number;
    name: string;
  };
}

interface Category {
  id: number;
  name: string;
}

interface ProductoFormProps {
  product?: Product | null;
  categories: Category[];
  onSave: (formData: FormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const validationSchema = Yup.object({
  name: Yup.string().required("El nombre es requerido"),
  description: Yup.string().required("La descripción es requerida"),
  price: Yup.number()
    .required("El precio es requerido")
    .positive("El precio debe ser positivo"),
  precio_de_oferta: Yup.number()
    .positive("El precio de oferta debe ser positivo")
    .test("less-than-price", "El precio de oferta debe ser menor al precio normal", function (value) {
      const price = this.parent.price
      if (value && price && value >= price) {
        return false
      }
      return true
    }),
  stock: Yup.number()
    .required("El stock es requerido")
    .integer("El stock debe ser un número entero")
    .min(0, "El stock no puede ser negativo"),
  categoryId: Yup.number().required("La categoría es requerida"),
})

const ProductoForm = ({ product, categories, onSave, onCancel, isSubmitting = false }: ProductoFormProps) => {
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [removeMainImage, setRemoveMainImage] = useState(false) // Nueva: marcar para eliminar imagen principal
  const [additionalImages, setAdditionalImages] = useState<File[]>([])
  const [additionalPreviews, setAdditionalPreviews] = useState<string[]>([])
  const [existingImages, setExistingImages] = useState<ProductImage[]>([]) // Nueva: imágenes existentes del producto
  const [imagesToDelete, setImagesToDelete] = useState<number[]>([]) // Nueva: IDs de imágenes a eliminar

  const formik = useFormik({
    initialValues: {
      name: product?.name || "",
      description: product?.description || "",
      price: product?.price || 0,
      precio_de_oferta: product?.precio_de_oferta || "",
      stock: product?.stock || 0,
      categoryId: product?.category?.id || "",
      imagen: null as File | null,
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        const formData = new FormData()
        formData.append("name", values.name)
        formData.append("description", values.description)
        formData.append("price", values.price.toString())
        if (values.precio_de_oferta) {
          formData.append("precio_de_oferta", values.precio_de_oferta.toString())
        }
        formData.append("stock", values.stock.toString())
        formData.append("categoryId", values.categoryId.toString())

        // Imagen principal
        if (values.imagen) {
          formData.append("imagen", values.imagen)
        }

        // Marcar si se debe eliminar la imagen principal
        if (removeMainImage) {
          formData.append("remove_main_image", "1")
        }

        // Agregar imágenes adicionales nuevas
        console.log(`🖼️ Additional images state:`, additionalImages)
        console.log(`🖼️ Number of additional images:`, additionalImages.length)

        additionalImages.forEach((file, index) => {
          console.log(`📎 Appending image ${index + 1}:`, file.name, file.size, 'bytes')
          formData.append("images[]", file)
        })

        // Enviar IDs de imágenes a eliminar
        if (imagesToDelete.length > 0) {
          imagesToDelete.forEach((id) => {
            formData.append("delete_images[]", id.toString())
          })
          console.log(`🗑️ Images to delete:`, imagesToDelete)
        }

        // Log final FormData content
        console.log(`📦 FormData contents:`)
        for (const [key, value] of formData.entries()) {
          if (value instanceof File) {
            console.log(`  ${key}:`, value.name, value.size, 'bytes')
          } else {
            console.log(`  ${key}:`, value)
          }
        }

        await onSave(formData)
      } catch (error) {
        console.error("Error al guardar el producto:", error)
      }
    },
  })

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      formik.setFieldValue("imagen", file)
      setRemoveMainImage(false) // Si sube una nueva, no marcar para eliminar
      const reader = new FileReader()
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveMainImage = () => {
    setImagePreview(null)
    setRemoveMainImage(true)
    formik.setFieldValue("imagen", null)
  }

  const handleAdditionalImagesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    console.log(`🎯 handleAdditionalImagesChange called, files:`, files)

    if (files && files.length > 0) {
      const newFiles = Array.from(files)
      console.log(`📁 New files selected:`, newFiles.length)
      newFiles.forEach((file, i) => {
        console.log(`  File ${i + 1}:`, file.name, file.size, 'bytes')
      })

      // Calcular total considerando imágenes existentes, nuevas y las que se van a agregar
      const totalImages = existingImages.length + additionalImages.length + newFiles.length
      console.log(`📊 Existing:`, existingImages.length, `+ Current new:`, additionalImages.length, `+ Adding:`, newFiles.length, `= Total:`, totalImages)

      // Limitar a 10 imágenes adicionales en total
      if (totalImages > 10) {
        alert("Máximo 10 imágenes adicionales permitidas en total")
        return
      }

      const updatedImages = [...additionalImages, ...newFiles]
      console.log(`✅ Setting additionalImages state to:`, updatedImages.length, 'files')
      setAdditionalImages(updatedImages)

      // Crear previews
      newFiles.forEach((file) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          setAdditionalPreviews((prev) => [...prev, e.target?.result as string])
        }
        reader.readAsDataURL(file)
      })

      // Limpiar el input para permitir volver a seleccionar
      event.target.value = ""
    }
  }

  const removeAdditionalImage = (index: number) => {
    // Verificar si es una imagen existente o nueva
    if (index < existingImages.length) {
      // Es una imagen existente del producto
      const imageToDelete = existingImages[index]
      setImagesToDelete((prev) => [...prev, imageToDelete.id])
      setExistingImages((prev) => prev.filter((_, i) => i !== index))
      console.log(`🗑️ Marked existing image for deletion:`, imageToDelete.id)
    } else {
      // Es una imagen nueva que se acaba de subir
      const newImageIndex = index - existingImages.length
      setAdditionalImages((prev) => prev.filter((_, i) => i !== newImageIndex))
      console.log(`🗑️ Removed new image at index:`, newImageIndex)
    }
    setAdditionalPreviews((prev) => prev.filter((_, i) => i !== index))
  }

  useEffect(() => {
    if (product?.imagen) {
      setImagePreview(buildImageUrl(product.imagen))
      setRemoveMainImage(false)
    } else {
      setImagePreview(null)
      setRemoveMainImage(false)
    }

    // Cargar imágenes adicionales existentes si las hay
    if (product?.images && product.images.length > 0) {
      const sortedImages = [...product.images].sort((a, b) => a.order - b.order)
      setExistingImages(sortedImages)
      const existingPreviews = sortedImages.map((img) => buildImageUrl(img.image_path))
      setAdditionalPreviews(existingPreviews)
      setAdditionalImages([]) // Limpiar imágenes nuevas
      setImagesToDelete([]) // Limpiar lista de eliminación
    } else {
      setExistingImages([])
      setAdditionalPreviews([])
      setAdditionalImages([])
      setImagesToDelete([])
    }
  }, [product])

  return (
    <form onSubmit={formik.handleSubmit} className="space-y-6">
      {/* Name Field */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <div className="flex items-center gap-2">
            <FaTag className="text-primary" />
            Nombre del Producto *
          </div>
        </label>
        <input
          id="name"
          name="name"
          type="text"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.name}
          className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border ${
            formik.touched.name && formik.errors.name
              ? "border-red-500"
              : "border-gray-300 dark:border-gray-700"
          } rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all`}
          placeholder="Ingrese el nombre del producto"
        />
        {formik.touched.name && formik.errors.name && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-sm text-red-500"
          >
            {formik.errors.name}
          </motion.p>
        )}
      </motion.div>

      {/* Description Field */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <div className="flex items-center gap-2">
            <FaAlignLeft className="text-primary" />
            Descripción *
          </div>
        </label>
        <textarea
          id="description"
          name="description"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.description}
          rows={4}
          className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border ${
            formik.touched.description && formik.errors.description
              ? "border-red-500"
              : "border-gray-300 dark:border-gray-700"
          } rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-vertical`}
          placeholder="Ingrese la descripción del producto"
        />
        {formik.touched.description && formik.errors.description && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-sm text-red-500"
          >
            {formik.errors.description}
          </motion.p>
        )}
      </motion.div>

      {/* Category Field */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <div className="flex items-center gap-2">
            <FaLayerGroup className="text-primary" />
            Categoría *
          </div>
        </label>
        <select
          id="categoryId"
          name="categoryId"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.categoryId}
          className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border ${
            formik.touched.categoryId && formik.errors.categoryId
              ? "border-red-500"
              : "border-gray-300 dark:border-gray-700"
          } rounded-xl text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all`}
        >
          <option value="">Seleccionar categoría</option>
          {categories
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
        </select>
        {formik.touched.categoryId && formik.errors.categoryId && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-sm text-red-500"
          >
            {formik.errors.categoryId}
          </motion.p>
        )}
      </motion.div>

      {/* Price Fields - Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Price Field */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <label htmlFor="price" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <div className="flex items-center gap-2">
              <FaDollarSign className="text-primary" />
              Precio (S/) *
            </div>
          </label>
          <input
            id="price"
            name="price"
            type="number"
            step="0.01"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.price}
            className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border ${
              formik.touched.price && formik.errors.price
                ? "border-red-500"
                : "border-gray-300 dark:border-gray-700"
            } rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all`}
            placeholder="0.00"
          />
          {formik.touched.price && formik.errors.price && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-sm text-red-500"
            >
              {formik.errors.price}
            </motion.p>
          )}
        </motion.div>

        {/* Offer Price Field */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <label htmlFor="precio_de_oferta" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <div className="flex items-center gap-2">
              <FaDollarSign className="text-primary" />
              Precio de Oferta (S/)
            </div>
          </label>
          <input
            id="precio_de_oferta"
            name="precio_de_oferta"
            type="number"
            step="0.01"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.precio_de_oferta}
            className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border ${
              formik.touched.precio_de_oferta && formik.errors.precio_de_oferta
                ? "border-red-500"
                : "border-gray-300 dark:border-gray-700"
            } rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all`}
            placeholder="0.00"
          />
          {formik.touched.precio_de_oferta && formik.errors.precio_de_oferta && (
            <motion.p
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-sm text-red-500"
            >
              {formik.errors.precio_de_oferta}
            </motion.p>
          )}
        </motion.div>
      </div>

      {/* Stock Field */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <label htmlFor="stock" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <div className="flex items-center gap-2">
            <FaBoxOpen className="text-primary" />
            Stock *
          </div>
        </label>
        <input
          id="stock"
          name="stock"
          type="number"
          onChange={formik.handleChange}
          onBlur={formik.handleBlur}
          value={formik.values.stock}
          className={`w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border ${
            formik.touched.stock && formik.errors.stock
              ? "border-red-500"
              : "border-gray-300 dark:border-gray-700"
          } rounded-xl text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all`}
          placeholder="0"
        />
        {formik.touched.stock && formik.errors.stock && (
          <motion.p
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 text-sm text-red-500"
          >
            {formik.errors.stock}
          </motion.p>
        )}
      </motion.div>

      {/* Image Field */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <label htmlFor="imagen" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <div className="flex items-center gap-2">
            <FaImage className="text-primary" />
            Imagen Principal del Producto
          </div>
        </label>
        <input
          id="imagen"
          name="imagen"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-white hover:file:bg-primary/90 file:cursor-pointer transition-all"
        />
        {imagePreview && !removeMainImage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 relative inline-block group"
          >
            <img
              src={imagePreview}
              alt="Vista previa"
              className="max-w-full h-48 object-cover rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-lg"
            />
            <motion.button
              type="button"
              onClick={handleRemoveMainImage}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <FaTimes className="text-sm" />
            </motion.button>
          </motion.div>
        )}
      </motion.div>

      {/* Additional Images Field */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.75 }}
      >
        <label htmlFor="additionalImages" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          <div className="flex items-center gap-2">
            <FaImage className="text-primary" />
            Imágenes Adicionales
            <span className="text-xs text-gray-500 dark:text-gray-400">(Máximo 10)</span>
          </div>
        </label>

        <div className="space-y-4">
          {/* Upload Button */}
          <label
            htmlFor="additionalImages"
            className="flex items-center justify-center gap-2 w-full px-4 py-8 bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-600 dark:text-gray-400 hover:border-primary hover:text-primary hover:bg-primary/5 cursor-pointer transition-all"
          >
            <FaPlus className="text-xl" />
            <span className="font-medium">Agregar imágenes adicionales</span>
          </label>
          <input
            id="additionalImages"
            name="additionalImages"
            type="file"
            accept="image/*"
            multiple
            onChange={handleAdditionalImagesChange}
            className="hidden"
          />

          {/* Image Previews Grid */}
          {additionalPreviews.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              <AnimatePresence>
                {additionalPreviews.map((preview, index) => (
                  <motion.div
                    key={`preview-${index}`}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.2 }}
                    className="relative group"
                  >
                    <img
                      src={preview}
                      alt={`Imagen adicional ${index + 1}`}
                      className="w-full h-32 object-cover rounded-xl border-2 border-gray-200 dark:border-gray-700 shadow-md"
                    />
                    {/* Remove button - mostrar siempre, tanto para imágenes existentes como nuevas */}
                    <motion.button
                      type="button"
                      onClick={() => removeAdditionalImage(index)}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FaTimes className="text-xs" />
                    </motion.button>
                    <div className="absolute bottom-2 right-2 bg-black/50 text-white text-xs px-2 py-1 rounded-lg">
                      {index + 1}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          <p className="text-xs text-gray-500 dark:text-gray-400">
            {additionalImages.length} / 10 imágenes nuevas seleccionadas
            {existingImages.length > 0 && (
              <> · {existingImages.length} imágenes existentes</>
            )}
            {imagesToDelete.length > 0 && (
              <> · {imagesToDelete.length} marcadas para eliminar</>
            )}
          </p>
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="flex gap-3 pt-4"
      >
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCancel}
          className="flex-1 py-3 px-4 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          Cancelar
        </motion.button>
        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          disabled={isSubmitting}
          className="flex-1 py-3 px-4 bg-gradient-to-r from-primary to-rh-gold text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Guardando..." : product ? "Actualizar" : "Crear"}
        </motion.button>
      </motion.div>
    </form>
  )
}

export default ProductoForm
