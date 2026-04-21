"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { orderService, Order } from '@/services/orderService';
import { ecommerceAuthService } from '@/services/ecommerceApi';

export default function MisPedidosPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check authentication
    if (!ecommerceAuthService.isAuthenticated()) {
      router.push('/iniciar-sesion?redirect=/mis-pedidos');
      return;
    }

    loadOrders();
  }, [router]);

  const loadOrders = async () => {
    try {
      const response = await orderService.getMyOrders();
      if (response.success) {
        setOrders(response.pedidos);
      }
    } catch (error) {
      console.error('Error al cargar pedidos:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado: string) => {
    const colors: any = {
      pendiente: 'bg-yellow-100 text-yellow-800',
      pagado: 'bg-green-100 text-green-800',
      procesando: 'bg-blue-100 text-blue-800',
      enviado: 'bg-purple-100 text-purple-800',
      entregado: 'bg-green-100 text-green-800',
      cancelado: 'bg-red-100 text-red-800',
      fallido: 'bg-red-100 text-red-800'
    };
    return colors[estado] || 'bg-yellow-100 text-yellow-800';
  };

  const getEstadoLabel = (estado: string) => {
    const labels: any = {
      pendiente: 'Pendiente',
      pagado: 'Pagado',
      procesando: 'Procesando',
      enviado: 'Enviado',
      entregado: 'Entregado',
      cancelado: 'Cancelado',
      fallido: 'Fallido'
    };
    return labels[estado] || estado;
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48 mx-auto"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mis Pedidos</h1>
        <p className="text-gray-600">Revisa el estado de tus pedidos</p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-lg shadow">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 rounded-full mb-4">
            <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2">No tienes pedidos aún</h2>
          <p className="text-gray-600 mb-6">Explora nuestro catálogo y realiza tu primera compra</p>
          <Link
            href="/catalogo"
            className="inline-block bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition shadow-lg"
          >
            Explorar Productos
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id_pedido} className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow">
              <div className="p-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 pb-4 border-b">
                  <div className="mb-3 md:mb-0">
                    <div className="flex items-center space-x-3 mb-1">
                      <h3 className="font-semibold text-lg">{order.numero_pedido}</h3>
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getEstadoColor(order.estado)}`}>
                        {getEstadoLabel(order.estado)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      {new Date(order.fecha_creacion).toLocaleDateString('es-PE', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>

                  <div className="text-left md:text-right">
                    <p className="text-sm text-gray-600">Total</p>
                    <p className="font-bold text-2xl text-blue-600">
                      S/ {parseFloat(order.total_final).toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Products preview */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Productos:</p>
                  <div className="space-y-2">
                    {order.detalles.slice(0, 3).map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span className="text-gray-700">
                          {item.producto_nombre} <span className="text-gray-500">×{item.cantidad}</span>
                        </span>
                        <span className="font-medium">
                          S/ {parseFloat(item.subtotal_con_igv).toFixed(2)}
                        </span>
                      </div>
                    ))}
                    {order.detalles.length > 3 && (
                      <p className="text-sm text-gray-500 italic">
                        +{order.detalles.length - 3} producto(s) más
                      </p>
                    )}
                  </div>
                </div>

                {/* Delivery info */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 text-sm">
                    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                    </svg>
                    <span className="text-gray-700">
                      {order.tipo_entrega === 'domicilio' ? 'Envío a domicilio' : 'Recojo en tienda'}
                    </span>
                  </div>
                  {order.tracking_code && (
                    <div className="mt-2 text-sm">
                      <span className="text-gray-600">Tracking: </span>
                      <span className="font-mono text-blue-600">{order.tracking_code}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href={`/order-confirmation/${order.numero_pedido}`}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center py-2.5 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition shadow"
                  >
                    Ver Detalles
                  </Link>

                  {order.estado_pago === 'pendiente' && (
                    <button className="flex-1 bg-green-600 text-white text-center py-2.5 rounded-lg font-semibold hover:bg-green-700 transition shadow">
                      Pagar Ahora
                    </button>
                  )}

                  <a
                    href="https://wa.me/51967411110"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 border-2 border-gray-300 text-gray-700 text-center py-2.5 rounded-lg font-semibold hover:border-gray-400 hover:bg-gray-50 transition"
                  >
                    Soporte
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
