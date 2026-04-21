"use client";

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { orderService } from '@/services/orderService';
import { ecommerceAuthService } from '@/services/ecommerceApi';

export default function OrderConfirmationPage() {
  const params = useParams();
  const numeroPedido = params.numeroPedido as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadOrder();
    setIsAuthenticated(ecommerceAuthService.isAuthenticated());
  }, [numeroPedido]);

  const loadOrder = async () => {
    try {
      const response = await orderService.trackOrder(numeroPedido);
      if (response.success) {
        setOrder(response.pedido);
      }
    } catch (error) {
      console.error('Error al cargar pedido:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="animate-pulse">
          <div className="h-16 w-16 bg-gray-200 rounded-full mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-md mx-auto">
          <div className="text-6xl mb-4">❌</div>
          <h1 className="text-2xl font-bold mb-2">Pedido no encontrado</h1>
          <p className="text-gray-600 mb-6">
            No pudimos encontrar el pedido con el número {numeroPedido}
          </p>
          <Link
            href="/catalogo"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Ir al Catálogo
          </Link>
        </div>
      </div>
    );
  }

  const getEstadoBadge = (estado: string) => {
    const badges: any = {
      pendiente: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Pendiente' },
      pagado: { bg: 'bg-green-100', text: 'text-green-800', label: 'Pagado' },
      procesando: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Procesando' },
      enviado: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Enviado' },
      entregado: { bg: 'bg-green-100', text: 'text-green-800', label: 'Entregado' },
      cancelado: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelado' },
      fallido: { bg: 'bg-red-100', text: 'text-red-800', label: 'Fallido' }
    };
    const badge = badges[estado] || badges.pendiente;
    return (
      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${badge.bg} ${badge.text}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Success header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
          <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold mb-2">¡Pedido Confirmado!</h1>
        <p className="text-gray-600">
          Tu pedido ha sido recibido y está siendo procesado
        </p>
      </div>

      {/* Order info */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div>
            <p className="text-sm text-gray-600">Número de Pedido</p>
            <p className="font-semibold text-lg">{order.numero_pedido}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Total</p>
            <p className="font-semibold text-lg text-blue-600">S/ {parseFloat(order.total_final).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Fecha</p>
            <p className="font-semibold text-lg">
              {new Date(order.fecha_creacion).toLocaleDateString('es-PE')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <p className="text-sm text-gray-600 mb-1">Estado del Pedido</p>
            {getEstadoBadge(order.estado)}
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Estado de Pago</p>
            {getEstadoBadge(order.estado_pago)}
          </div>
        </div>
      </div>

      {/* Payment instructions */}
      {order.estado_pago === 'pendiente' && (
        <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-6 mb-6">
          <div className="flex items-start space-x-3">
            <svg className="w-6 h-6 text-blue-600 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h3 className="text-lg font-semibold mb-2 text-blue-900">Completa tu pago</h3>
              <p className="text-sm mb-3 text-blue-800">
                Tu pedido está reservado por 15 minutos. Por favor completa el pago para confirmar tu orden.
              </p>
              <p className="text-sm text-blue-700 mb-4">
                Te enviaremos instrucciones de pago al correo: <strong>{order.cliente_email}</strong>
              </p>
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition">
                Ver Instrucciones de Pago
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order items */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Productos</h2>
        <div className="space-y-4">
          {order.detalles?.map((item: any, index: number) => (
            <div key={index} className="flex justify-between items-center pb-4 border-b last:border-0">
              <div className="flex-1">
                <p className="font-medium">{item.producto_nombre}</p>
                <p className="text-sm text-gray-600">
                  Cantidad: {item.cantidad} × S/ {parseFloat(item.precio_unitario_con_igv).toFixed(2)}
                </p>
              </div>
              <p className="font-semibold text-lg">
                S/ {parseFloat(item.subtotal_con_igv).toFixed(2)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Delivery info */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Información de Entrega</h2>
        <div className="space-y-2 text-sm">
          <p>
            <span className="font-medium">Método:</span>{' '}
            {order.tipo_entrega === 'domicilio' ? 'Envío a domicilio' : 'Recojo en tienda'}
          </p>
          {order.tracking_code && (
            <p>
              <span className="font-medium">Código de seguimiento:</span> {order.tracking_code}
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        {isAuthenticated && (
          <Link
            href="/mis-pedidos"
            className="block w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white text-center py-3 rounded-lg font-semibold hover:from-purple-700 hover:to-purple-800 transition shadow-lg flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            Ver en Mis Pedidos
          </Link>
        )}

        <Link
          href={`/pedidos/seguimiento/${order.numero_pedido}`}
          className="block w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white text-center py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition shadow-lg"
        >
          Seguir mi Pedido
        </Link>

        <Link
          href="/catalogo"
          className="block w-full border-2 border-blue-600 text-blue-600 text-center py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
        >
          Continuar Comprando
        </Link>
      </div>

      {/* Help section */}
      <div className="mt-8 p-4 bg-gray-50 rounded-lg text-center text-sm text-gray-600">
        <p className="mb-2">¿Necesitas ayuda con tu pedido?</p>
        <a href="https://wa.me/51967411110" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
          Contáctanos por WhatsApp
        </a>
      </div>
    </div>
  );
}
