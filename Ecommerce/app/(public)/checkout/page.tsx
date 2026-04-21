"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { cartService, CartItem } from '@/services/cartService';
import { orderService, CreateOrderRequest } from '@/services/orderService';
import { ecommerceAuthService } from '@/services/ecommerceApi';

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [isLoadingCart, setIsLoadingCart] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isMounted, setIsMounted] = useState(false);

  const [formData, setFormData] = useState<CreateOrderRequest>({
    cliente_email: '',
    cliente_nombre: '',
    cliente_telefono: '',
    tipo_entrega: 'domicilio',
    metodo_pago: 'yape',
    requiere_factura: false
  });

  // Primer useEffect: Solo para marcar como montado
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Segundo useEffect: Cargar carrito solo cuando esté montado
  useEffect(() => {
    if (!isMounted) return;

    console.log('🛒 Checkout: Componente montado, cargando carrito...');
    console.log('🛒 Checkout: localStorage disponible:', typeof localStorage !== 'undefined');

    const loadCart = () => {
      try {
        const rawCart = localStorage.getItem('catalogo_cart_items');
        console.log('🛒 Checkout: localStorage raw:', rawCart);

        if (!rawCart || rawCart === '[]') {
          console.log('⚠️ Checkout: Carrito vacío en localStorage');
          setIsLoadingCart(false);
          alert('Tu carrito está vacío');
          router.push('/catalogo');
          return;
        }

        const cart = JSON.parse(rawCart);
        console.log('🛒 Checkout: Cart parseado:', cart);

        if (!Array.isArray(cart) || cart.length === 0) {
          console.log('⚠️ Checkout: Carrito vacío o inválido');
          setIsLoadingCart(false);
          alert('Tu carrito está vacío');
          router.push('/catalogo');
          return;
        }

        console.log('✅ Checkout: Carrito cargado exitosamente con', cart.length, 'items');
        setCartItems(cart);
        setIsLoadingCart(false);

        // Cargar datos del usuario si está autenticado
        const user = ecommerceAuthService.getCurrentUser();
        if (user) {
          setCurrentUser(user);
          setFormData(prev => ({
            ...prev,
            cliente_email: user.email || '',
            cliente_nombre: user.name || '',
            cliente_telefono: user.celular || ''
          }));
        }
      } catch (error) {
        console.error('❌ Checkout: Error al cargar carrito:', error);
        setIsLoadingCart(false);
        alert('Error al cargar el carrito');
        router.push('/catalogo');
      }
    };

    // Pequeño delay para dar tiempo a la hidratación
    const timer = setTimeout(loadCart, 100);
    return () => clearTimeout(timer);
  }, [isMounted, router]);

  const calcularSubtotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const calcularCostoEnvio = () => {
    return formData.tipo_entrega === 'domicilio' ? 10.00 : 0.00;
  };

  const calcularTotal = () => {
    return calcularSubtotal() + calcularCostoEnvio();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    let orderData: CreateOrderRequest | null = null;

    try {
      // Validaciones
      if (!formData.cliente_email || !formData.cliente_nombre || !formData.cliente_telefono) {
        alert('Por favor completa todos los campos requeridos');
        setLoading(false);
        return;
      }

      if (formData.tipo_entrega === 'domicilio') {
        if (!formData.direccion_envio || !formData.direccion_distrito) {
          alert('Por favor completa la dirección de envío');
          setLoading(false);
          return;
        }
      }

      // Debug: Verificar estado antes de enviar
      console.log('🔍 Estado antes de crear pedido:');
      console.log('  - currentUser:', currentUser);
      console.log('  - cartItems:', cartItems);
      console.log('  - cartItems.length:', cartItems.length);

      // Preparar datos del pedido
      // IMPORTANTE: Siempre enviar items desde localStorage para garantizar que el pedido tenga productos
      // El backend dará prioridad a los items enviados si el carrito en BD está vacío
      orderData = {
        ...formData,
        items: cartItems.map(item => ({
          productId: item.productId,
          quantity: item.quantity
        }))
      };

      console.log('📤 Enviando pedido al backend:', JSON.stringify(orderData, null, 2));

      // Crear pedido
      const response = await orderService.createOrder(orderData);

      console.log('✅ Respuesta del backend:', response);

      if (response.success) {
        // Limpiar carrito
        await cartService.clearCart();

        // Si hay link de pago de Culqi, redirigir allí
        if (response.payment_link && !response.payment_link.includes('pago-manual')) {
          console.log('🔗 Redirigiendo a Culqi:', response.payment_link);
          // Redirigir a la pasarela de pago de Culqi
          window.location.href = response.payment_link;
        } else {
          // Sin pasarela de pago, ir directo a confirmación (pago manual)
          router.push(`/order-confirmation/${response.pedido.numero_pedido}`);
        }
      }
    } catch (error: any) {
      console.error('❌ Error completo:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error data:', error.response?.data);
      if (orderData) {
        console.error('❌ Datos que se intentaron enviar:', JSON.stringify(orderData, null, 2));
      }

      const errorMessage = error.response?.data?.message || error.message || 'Error al procesar el pedido';
      alert(`Error: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  if (isLoadingCart) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Cargando carrito...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-3xl font-bold mb-8">Finalizar Compra</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario de checkout */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Información del cliente */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Información de Contacto</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Nombre Completo *</label>
                  <input
                    type="text"
                    value={formData.cliente_nombre}
                    onChange={(e) => setFormData({...formData, cliente_nombre: e.target.value})}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    value={formData.cliente_email}
                    onChange={(e) => setFormData({...formData, cliente_email: e.target.value})}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Teléfono *</label>
                  <input
                    type="tel"
                    value={formData.cliente_telefono}
                    onChange={(e) => setFormData({...formData, cliente_telefono: e.target.value})}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Tipo de Documento</label>
                  <select
                    value={formData.cliente_documento_tipo || ''}
                    onChange={(e) => setFormData({...formData, cliente_documento_tipo: e.target.value as any})}
                    className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Seleccionar</option>
                    <option value="DNI">DNI</option>
                    <option value="RUC">RUC</option>
                    <option value="CE">Carné de Extranjería</option>
                  </select>
                </div>

                {formData.cliente_documento_tipo && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Número de Documento</label>
                    <input
                      type="text"
                      value={formData.cliente_documento_numero || ''}
                      onChange={(e) => setFormData({...formData, cliente_documento_numero: e.target.value})}
                      className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      maxLength={formData.cliente_documento_tipo === 'DNI' ? 8 : 11}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Método de entrega */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Método de Entrega</h2>

              <div className="space-y-4">
                <label className="flex items-center space-x-3 cursor-pointer p-4 border rounded-lg hover:bg-gray-50">
                  <input
                    type="radio"
                    name="tipo_entrega"
                    value="domicilio"
                    checked={formData.tipo_entrega === 'domicilio'}
                    onChange={(e) => setFormData({...formData, tipo_entrega: e.target.value as any})}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="font-medium">Envío a domicilio</div>
                    <div className="text-sm text-gray-600">S/ 10.00</div>
                  </div>
                </label>

                <label className="flex items-center space-x-3 cursor-pointer p-4 border rounded-lg hover:bg-gray-50">
                  <input
                    type="radio"
                    name="tipo_entrega"
                    value="recojo_tienda"
                    checked={formData.tipo_entrega === 'recojo_tienda'}
                    onChange={(e) => setFormData({...formData, tipo_entrega: e.target.value as any})}
                    className="w-4 h-4 text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="font-medium">Recojo en tienda</div>
                    <div className="text-sm text-gray-600">Gratis</div>
                  </div>
                </label>
              </div>

              {formData.tipo_entrega === 'domicilio' && (
                <div className="mt-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Dirección *</label>
                    <input
                      type="text"
                      value={formData.direccion_envio || ''}
                      onChange={(e) => setFormData({...formData, direccion_envio: e.target.value})}
                      className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Av. Principal 123"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Departamento</label>
                      <input
                        type="text"
                        value={formData.direccion_departamento || ''}
                        onChange={(e) => setFormData({...formData, direccion_departamento: e.target.value})}
                        className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Lima"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Provincia</label>
                      <input
                        type="text"
                        value={formData.direccion_provincia || ''}
                        onChange={(e) => setFormData({...formData, direccion_provincia: e.target.value})}
                        className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Lima"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Distrito *</label>
                      <input
                        type="text"
                        value={formData.direccion_distrito || ''}
                        onChange={(e) => setFormData({...formData, direccion_distrito: e.target.value})}
                        className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="Miraflores"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Referencia</label>
                    <textarea
                      value={formData.direccion_referencia || ''}
                      onChange={(e) => setFormData({...formData, direccion_referencia: e.target.value})}
                      className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={2}
                      placeholder="Casa color azul, cerca al parque"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Método de pago */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Método de Pago</h2>

              <div className="space-y-2">
                {[
                  { value: 'yape', label: 'Yape' },
                  { value: 'plin', label: 'Plin' },
                  { value: 'transferencia', label: 'Transferencia Bancaria' },
                  { value: 'tarjeta', label: 'Tarjeta de Crédito/Débito' },
                  { value: 'contraentrega', label: 'Pago Contra Entrega' }
                ].map((metodo) => (
                  <label key={metodo.value} className="flex items-center space-x-3 cursor-pointer p-3 border rounded-lg hover:bg-gray-50">
                    <input
                      type="radio"
                      name="metodo_pago"
                      value={metodo.value}
                      checked={formData.metodo_pago === metodo.value}
                      onChange={(e) => setFormData({...formData, metodo_pago: e.target.value as any})}
                      className="w-4 h-4 text-blue-600"
                    />
                    <span>{metodo.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Notas adicionales */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Notas Adicionales (Opcional)</h2>
              <textarea
                value={formData.notas_cliente || ''}
                onChange={(e) => setFormData({...formData, notas_cliente: e.target.value})}
                className="w-full border rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="Agrega cualquier información adicional sobre tu pedido..."
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
            >
              {loading ? 'Procesando...' : 'Confirmar Pedido'}
            </button>
          </form>
        </div>

        {/* Resumen del pedido */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-4">
            <h2 className="text-xl font-semibold mb-4">Resumen del Pedido</h2>

            <div className="space-y-3 mb-4 max-h-60 overflow-y-auto">
              {cartItems.map((item) => (
                <div key={item.productId} className="flex justify-between text-sm">
                  <div className="flex-1">
                    <div className="font-medium">{item.name}</div>
                    <div className="text-gray-600">Cantidad: {item.quantity}</div>
                  </div>
                  <div className="font-semibold">
                    S/ {(item.price * item.quantity).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4 space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>S/ {calcularSubtotal().toFixed(2)}</span>
              </div>

              <div className="flex justify-between">
                <span>Envío:</span>
                <span className={calcularCostoEnvio() === 0 ? 'text-green-600 font-medium' : ''}>
                  {calcularCostoEnvio() === 0 ? 'GRATIS' : `S/ ${calcularCostoEnvio().toFixed(2)}`}
                </span>
              </div>

              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total:</span>
                <span className="text-blue-600">S/ {calcularTotal().toFixed(2)}</span>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
              <p>✓ Compra segura</p>
              <p>✓ Envío en 24-48 horas</p>
              <p>✓ Garantía de satisfacción</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
