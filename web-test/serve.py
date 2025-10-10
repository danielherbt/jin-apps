#!/usr/bin/env python3
"""
Servidor HTTP simple para servir la aplicación web de testing del sistema POS
"""
import http.server
import socketserver
import os
import webbrowser
from pathlib import Path

# Configuración
PORT = 3000
HOST = "localhost"
DIRECTORY = Path(__file__).parent

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Handler personalizado con CORS habilitado"""
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)
    
    def end_headers(self):
        # Habilitar CORS para desarrollo
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_OPTIONS(self):
        """Manejar requests OPTIONS para CORS"""
        self.send_response(200)
        self.end_headers()
    
    def log_message(self, format, *args):
        """Log personalizado"""
        print(f"🌐 [{self.address_string()}] {format % args}")

def main():
    # Cambiar al directorio de la aplicación web
    os.chdir(DIRECTORY)
    
    print("🚀 Iniciando servidor web para el sistema POS...")
    print(f"📁 Directorio: {DIRECTORY}")
    print(f"🔗 URL: http://{HOST}:{PORT}")
    print("=" * 50)
    
    # Crear y configurar el servidor
    with socketserver.TCPServer((HOST, PORT), CustomHTTPRequestHandler) as httpd:
        print(f"✅ Servidor ejecutándose en http://{HOST}:{PORT}")
        print("📋 Funcionalidades disponibles:")
        print("   - Dashboard de servicios")
        print("   - Pruebas de APIs")
        print("   - Simulación de operaciones")
        print("   - Monitoreo en tiempo real")
        print()
        print("🛑 Para detener el servidor: Ctrl+C")
        print("=" * 50)
        
        try:
            # Abrir navegador automáticamente
            url = f"http://{HOST}:{PORT}"
            print(f"🌐 Abriendo navegador en: {url}")
            webbrowser.open(url)
            
            # Iniciar servidor
            httpd.serve_forever()
            
        except KeyboardInterrupt:
            print("\n🛑 Deteniendo servidor...")
            print("✅ Servidor detenido correctamente")

if __name__ == "__main__":
    main()