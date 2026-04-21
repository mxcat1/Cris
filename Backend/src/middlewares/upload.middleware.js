// middlewares/upload.js
const fs = require('fs');
const multer = require('multer');
const path = require('path');

// Mapa fieldname → subdirectorio bajo src/uploads/
// Si en el futuro se migra a uploads/public/<tipo> o uploads/private/<tipo>
// (HC8 pleno para fix-wave-2), solo cambia este mapa.
const SUBDIR_BY_FIELDNAME = {
    logo: 'logos',
    cert: 'certs',
    imagen: 'productos',
    imagen_categoria: 'categorias',
    imagen_banner: 'banner',
    imagen_tarjeta: 'tarjetas',
};

// Configuración de almacenamiento
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const subdir = SUBDIR_BY_FIELDNAME[file.fieldname];
        if (!subdir) {
            return cb(new Error('Tipo de archivo no permitido'), null);
        }
        const dest = path.join(__dirname, '../uploads', subdir);
        // Self-healing: garantizar que el dir exista antes de escribir.
        // Multer NO crea dirs automáticamente y el named volume
        // `erpcomp_backend_uploads` puede estar vacío tras `docker compose down -v`
        // o un build sin seed inicial. mkdirSync recursive es idempotente y barato.
        // (fix-wave-1.1 / HC8 hot-patch)
        fs.mkdirSync(dest, { recursive: true });
        cb(null, dest);
    },
    filename: (req, file, cb) => {
        // Generar un nombre único para el archivo
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    }
});

// Opciones adicionales, si lo necesitas
const fileFilter = (req, file, cb) => {

    // Por ejemplo, para permitir solo imágenes en el logo y .pem o .txt en cert
    if (file.fieldname === 'logo') {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes para el logo'));
        }
    } else if (file.fieldname === 'cert') {
        if (file.mimetype === 'application/x-pem-file' || file.mimetype === 'text/plain' || file.mimetype === 'application/x-x509-ca-cert'
        ) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos pem o txt para el certificado'));
        }
    } else if (file.fieldname === 'imagen') {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes para el producto'));
        }
    } else if (file.fieldname === 'imagen_categoria') {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes para la categoría'));
        }
    } else if (file.fieldname === 'imagen_banner') {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes para el banner'));
        }
    } else if (file.fieldname === 'imagen_tarjeta') {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten imágenes para la tarjeta'));
        }
    } else {
        cb(null, false);
    }
};

const upload = multer({
    storage,
    fileFilter
});

module.exports = upload;
