import React from "react";
import { motion } from "framer-motion";
import { Megaphone, MessageCircle, Layout, CreditCard } from "lucide-react";
import BannerListManager from "./BannerListManager";
import { BannerWhatsAppManager } from "./BannerManager";
import TarjetasManager from "./TarjetasManager";
import { useDocumentTitle } from "../../hooks/useDocumentTitle";

const MarketingPage: React.FC = () => {
  useDocumentTitle("Marketing");

  return (
    <div className="min-h-screen bg-background p-4 md:p-6 lg:p-8">
      <motion.div
        className="max-w-7xl mx-auto space-y-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <motion.div
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card/50 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-border/20"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Gestión de Marketing
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Administra los banners y tarjetas promocionales de tu sitio web
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Herramientas promocionales</span>
          </div>
        </motion.div>
        
        {/* Layout principal con sidebar para WhatsApp */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          
          {/* Columna principal - Banners y Tarjetas */}
          <div className="xl:col-span-3 space-y-6">
            
            {/* Banners Section */}
            <motion.div
              className="bg-card/30 backdrop-blur-sm rounded-2xl border border-border/20 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <div className="bg-gradient-to-r from-purple-600/10 to-pink-600/10 px-6 py-4 border-b border-border/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-600/20 rounded-lg">
                    <Layout className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Banners Promocionales
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Gestiona los banners del carrusel principal
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <BannerListManager />
              </div>
            </motion.div>

            {/* Tarjetas Section */}
            <motion.div
              className="bg-card/30 backdrop-blur-sm rounded-2xl border border-border/20 overflow-hidden"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <div className="bg-gradient-to-r from-blue-600/10 to-indigo-600/10 px-6 py-4 border-b border-border/20">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600/20 rounded-lg">
                    <CreditCard className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Tarjetas Promocionales
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Administra las tarjetas del sitio web
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <TarjetasManager />
              </div>
            </motion.div>
          </div>

          {/* Sidebar - WhatsApp compacto */}
          <motion.div
            className="xl:col-span-1 space-y-6"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {/* WhatsApp Configuration */}
            <div className="bg-card/30 backdrop-blur-sm rounded-2xl border border-border/20 overflow-hidden">
              <div className="bg-gradient-to-r from-green-600/10 to-emerald-600/10 px-4 py-3 border-b border-border/20">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-green-600/20 rounded-lg">
                    <MessageCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                      WhatsApp
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-300">
                      Configuración rápida
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4">
                <BannerWhatsAppManager />
              </div>
            </div>

          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default MarketingPage;