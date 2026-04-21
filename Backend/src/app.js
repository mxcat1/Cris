require("dotenv").config()

const express = require("express")
const http = require("http")
const cors = require("cors")
const morgan = require("morgan")

// Importación de rutas
const authRoutes = require("./routes/auth.routes")
const categoriaRoutes = require("./routes/categoria.routes")
const productoRoutes = require("./routes/producto.routes")
const companyRoutes = require("./routes/company.routes")
const ventaRoutes = require("./routes/venta.routes")
const codigo_barrasRoutes = require("./routes/codigo_barras.routes")
const userRoutes = require("./routes/users.routes")
const rucReniecRoutes = require("./routes/ruc.routes")
const reniecRoutes = require("./routes/reniec.routes")
const cierreCajaRoutes = require("./routes/cierre_caja.routes")
const auditLogRoutes = require("./routes/audit_log.routes")
const ofertasDelDiaRoutes = require("./routes/ofertasDelDia.routes")
const ecommerceRoutes = require("./routes/ecommerce.routes")
const marketingRoutes = require("./routes/marketing.routes")
const libroReclamacionesRoutes = require("./routes/libro_reclamaciones.routes");
const solicitudImportacionRoutes = require("./routes/solicitudImportacion.routes");
const features = require("./config/features");
const authMiddleware = require("./middlewares/auth.middleware");

const app = express()

// Middlewares
// S2: CORS whitelist desde FRONTEND_ORIGIN (env-driven, fail-secure en producción).
// La función se evalúa por request para poder ser testeable sin re-require del módulo.
app.use(cors({
  origin: function (origin, callback) {
    // Peticiones sin Origin (same-origin, curl, Postman, supertest sin header) → permitir
    if (!origin) return callback(null, true);

    const allowedOrigins = process.env.FRONTEND_ORIGIN
      ? process.env.FRONTEND_ORIGIN.split(',').map(function (o) { return o.trim(); })
      : (process.env.NODE_ENV === 'production' ? [] : ['http://localhost:5173']);

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, false);
    }
  },
  credentials: true,
}));
app.use(express.json())
// S3: Uploads split público/privado (D1=A).
// /uploads/public → acceso libre (logos, imágenes de producto).
// /uploads/private → requiere token JWT (comprobantes, docs sensibles).
// /uploads → grace period para rutas legacy ya persistidas en DB.
app.use("/uploads/public", express.static("src/uploads/public"));
app.use("/uploads/private", authMiddleware, express.static("src/uploads/private"));
app.use("/uploads", express.static("src/uploads"));
app.use(morgan("dev")) // Para logs en desarrollo

// Rutas API
app.use("/api/auth", authRoutes)
app.use("/api/categorias", categoriaRoutes)
app.use("/api/productos", productoRoutes)
app.use("/api/codigos-barras", codigo_barrasRoutes)
app.use("/api/companies", companyRoutes)
app.use("/api/cierre-caja", cierreCajaRoutes)
app.use("/api/ventas", ventaRoutes)
app.use("/api/users", userRoutes)
app.use("/api/ruc", rucReniecRoutes)
app.use("/api/dni", reniecRoutes)
app.use("/api/audit-logs", auditLogRoutes)

app.use("/api/ofertas-del-dia", ofertasDelDiaRoutes)

if (features.FEATURE_ECOMMERCE) {
  app.use("/api/ecommerce", ecommerceRoutes)
  // Endpoints admin de solicitudes de importación (hot-patch B).
  // authMiddleware aplicado en el propio router.
  app.use("/api/solicitudes-importacion", solicitudImportacionRoutes)
}

if (features.FEATURE_MARKETING) {
  app.use("/api/marketing", marketingRoutes)
}

if (features.FEATURE_LIBRO_RECLAMACIONES) {
  app.use("/api/libro-reclamaciones", libroReclamacionesRoutes);
}

// Ruta básica para verificar que el servidor está funcionando
app.get("/", (req, res) => {
  res.json({ message: "API Backend con autenticación funcionando correctamente" })
})

const server = http.createServer(app)

module.exports = {
  app,
  server,
}
