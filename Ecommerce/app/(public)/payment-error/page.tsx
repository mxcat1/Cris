"use client";

// ecommerce-integration hot-patch: useSearchParams en Next.js 15 requiere
// estar dentro de un Suspense boundary para permitir el prerender.
// Ref: https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { XCircle, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

function PaymentErrorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Obtener parámetros de error
    const order = searchParams.get('order');
    const error = searchParams.get('error');

    if (order) setOrderNumber(order);
    if (error) setErrorMessage(error);
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
          {/* Icono de error */}
          <div className="mb-6 flex justify-center">
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-full p-6">
              <XCircle className="w-16 h-16 text-white" />
            </div>
          </div>

          {/* Mensaje de error */}
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Error en el Pago
          </h1>

          <p className="text-gray-600 mb-6">
            No pudimos procesar tu pago. Por favor, intenta nuevamente.
          </p>

          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <div className="text-left">
                  <p className="text-sm font-medium text-red-800 mb-1">Detalles del error:</p>
                  <p className="text-sm text-red-600">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}

          {orderNumber && (
            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">Número de pedido:</p>
              <p className="text-xl font-bold text-gray-900">{orderNumber}</p>
              <p className="text-xs text-gray-500 mt-2">
                Tu pedido sigue activo. Puedes intentar pagar nuevamente.
              </p>
            </div>
          )}

          {/* Razones comunes */}
          <div className="bg-blue-50 rounded-xl p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-3 text-center">Razones comunes:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Fondos insuficientes</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Datos de tarjeta incorrectos</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Límite de compra excedido</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-500 mr-2">•</span>
                <span>Problemas de conexión</span>
              </li>
            </ul>
          </div>

          {/* Botones de acción */}
          <div className="space-y-3">
            {orderNumber && (
              <Link
                href={`/order-confirmation/${orderNumber}`}
                className="block w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
              >
                Intentar Pagar Nuevamente
              </Link>
            )}

            <Link
              href="/catalogo"
              className="block w-full py-3 px-6 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
            >
              Volver al Catálogo
            </Link>

            <button
              onClick={() => router.back()}
              className="block w-full py-3 px-6 text-gray-600 hover:text-gray-900 transition-all"
            >
              Volver Atrás
            </button>
          </div>
        </div>

        {/* Contacto */}
        <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
          <h3 className="font-semibold text-gray-900 mb-3 text-center">¿Necesitas ayuda?</h3>
          <p className="text-center text-sm text-gray-600 mb-4">
            Contáctanos y te ayudaremos a completar tu compra
          </p>
          <div className="flex justify-center gap-4">
            <a
              href="https://wa.me/51967411110"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-all"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PaymentErrorPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando…</div>}>
      <PaymentErrorContent />
    </Suspense>
  );
}
