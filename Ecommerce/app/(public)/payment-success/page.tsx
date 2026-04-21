"use client";

// ecommerce-integration hot-patch: useSearchParams en Next.js 15 requiere
// estar dentro de un Suspense boundary para permitir el prerender.
// Ref: https://nextjs.org/docs/messages/missing-suspense-with-csr-bailout
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderNumber, setOrderNumber] = useState('');

  useEffect(() => {
    // Obtener número de pedido de los query params
    const order = searchParams.get('order');
    if (order) {
      setOrderNumber(order);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-3xl shadow-2xl p-8 text-center">
          {/* Icono de éxito con animación */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-25"></div>
              <div className="relative bg-gradient-to-br from-green-500 to-green-600 rounded-full p-6">
                <CheckCircle className="w-16 h-16 text-white" />
              </div>
            </div>
          </div>

          {/* Mensaje de éxito */}
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            ¡Pago Exitoso!
          </h1>

          <p className="text-gray-600 mb-6">
            Tu pago ha sido procesado correctamente. Recibirás un correo de confirmación en breve.
          </p>

          {orderNumber && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-600 mb-1">Número de pedido:</p>
              <p className="text-xl font-bold text-green-600">{orderNumber}</p>
            </div>
          )}

          {/* Información adicional */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-900 mb-3 text-center">Próximos pasos:</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Recibirás un email de confirmación</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Tu pedido será procesado en las próximas 24 horas</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>Podrás hacer seguimiento de tu pedido</span>
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
                Ver Detalles del Pedido
              </Link>
            )}

            <Link
              href="/catalogo"
              className="block w-full py-3 px-6 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-all"
            >
              Seguir Comprando
            </Link>
          </div>
        </div>

        {/* Nota de seguridad */}
        <p className="text-center text-sm text-gray-500 mt-6">
          Si tienes alguna pregunta sobre tu pedido, contáctanos al WhatsApp:
          <a href="https://wa.me/51967411110" className="text-blue-600 hover:underline ml-1">
            +51 967 411 110
          </a>
        </p>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Cargando…</div>}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
