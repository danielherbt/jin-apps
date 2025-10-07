import xml.etree.ElementTree as ET
from datetime import datetime
import hashlib
import base64
import requests
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives import serialization
from cryptography import x509
import os
from .config import settings

class SRIClient:
    def __init__(self):
        self.environment = settings.SRI_ENVIRONMENT
        if self.environment == "production":
            self.recepcion_url = settings.SRI_RECEPCION_URL_PROD
            self.autorizacion_url = settings.SRI_AUTORIZACION_URL_PROD
        else:
            self.recepcion_url = settings.SRI_RECEPCION_URL_TEST
            self.autorizacion_url = settings.SRI_AUTORIZACION_URL_TEST

    def generate_access_key(self, ruc: str, date: str, type_doc: str, establishment: str, sequential: str):
        """Generate access key for SRI"""
        # Format: date + type_doc + ruc + environment + establishment + sequential + numeric_code + emission_type + check_digit
        key = f"{date}{type_doc}{ruc}1{establishment}{sequential}123456781"
        return self._calculate_check_digit(key)

    def _calculate_check_digit(self, key: str) -> str:
        """Calculate check digit using module 11"""
        factors = [2, 3, 4, 5, 6, 7]
        total = 0
        for i, digit in enumerate(reversed(key)):
            total += int(digit) * factors[i % len(factors)]
        remainder = total % 11
        check_digit = 11 - remainder
        if check_digit == 11:
            check_digit = 0
        elif check_digit == 10:
            check_digit = 1
        return key + str(check_digit)

    def generate_invoice_xml(self, invoice_data: dict) -> str:
        """Generate XML for invoice according to SRI format"""
        # This is a simplified version. In production, use the exact XSD schema
        root = ET.Element("factura", id="comprobante", version="1.0.0")

        # InfoTributaria
        info_trib = ET.SubElement(root, "infoTributaria")
        ET.SubElement(info_trib, "ambiente").text = "1" if self.environment == "production" else "2"
        ET.SubElement(info_trib, "tipoEmision").text = "1"
        ET.SubElement(info_trib, "razonSocial").text = invoice_data["company_name"]
        ET.SubElement(info_trib, "nombreComercial").text = invoice_data["company_name"]
        ET.SubElement(info_trib, "ruc").text = invoice_data["ruc"]
        ET.SubElement(info_trib, "claveAcceso").text = invoice_data["access_key"]
        ET.SubElement(info_trib, "codDoc").text = "01"  # Invoice
        ET.SubElement(info_trib, "estab").text = invoice_data["establishment"]
        ET.SubElement(info_trib, "ptoEmi").text = invoice_data["emission_point"]
        ET.SubElement(info_trib, "secuencial").text = invoice_data["sequential"]
        ET.SubElement(info_trib, "dirMatriz").text = invoice_data["address"]

        # InfoFactura
        info_fact = ET.SubElement(root, "infoFactura")
        ET.SubElement(info_fact, "fechaEmision").text = invoice_data["date"]
        ET.SubElement(info_fact, "dirEstablecimiento").text = invoice_data["address"]
        ET.SubElement(info_fact, "obligadoContabilidad").text = "SI"
        ET.SubElement(info_fact, "tipoIdentificacionComprador").text = invoice_data["buyer_id_type"]
        ET.SubElement(info_fact, "razonSocialComprador").text = invoice_data["buyer_name"]
        ET.SubElement(info_fact, "identificacionComprador").text = invoice_data["buyer_id"]
        ET.SubElement(info_fact, "totalSinImpuestos").text = str(invoice_data["subtotal"])
        ET.SubElement(info_fact, "totalDescuento").text = str(invoice_data["discount"])

        # Total con impuestos
        total_impuestos = ET.SubElement(info_fact, "totalConImpuestos")
        total_impuesto = ET.SubElement(total_impuestos, "totalImpuesto")
        ET.SubElement(total_impuesto, "codigo").text = "2"  # IVA
        ET.SubElement(total_impuesto, "codigoPorcentaje").text = "2"  # 12%
        ET.SubElement(total_impuesto, "baseImponible").text = str(invoice_data["subtotal"])
        ET.SubElement(total_impuesto, "valor").text = str(invoice_data["tax_amount"])

        ET.SubElement(info_fact, "propina").text = "0.00"
        ET.SubElement(info_fact, "importeTotal").text = str(invoice_data["total"])
        ET.SubElement(info_fact, "moneda").text = "DOLAR"

        # Detalles
        detalles = ET.SubElement(root, "detalles")
        for item in invoice_data["items"]:
            detalle = ET.SubElement(detalles, "detalle")
            ET.SubElement(detalle, "codigoPrincipal").text = item["code"]
            ET.SubElement(detalle, "descripcion").text = item["description"]
            ET.SubElement(detalle, "cantidad").text = str(item["quantity"])
            ET.SubElement(detalle, "precioUnitario").text = str(item["unit_price"])
            ET.SubElement(detalle, "descuento").text = str(item["discount"])
            ET.SubElement(detalle, "precioTotalSinImpuesto").text = str(item["subtotal"])

            # Impuestos por item
            impuestos = ET.SubElement(detalle, "impuestos")
            impuesto = ET.SubElement(impuestos, "impuesto")
            ET.SubElement(impuesto, "codigo").text = "2"
            ET.SubElement(impuesto, "codigoPorcentaje").text = "2"
            ET.SubElement(impuesto, "tarifa").text = "12.00"
            ET.SubElement(impuesto, "baseImponible").text = str(item["subtotal"])
            ET.SubElement(impuesto, "valor").text = str(item["tax"])

        # InfoAdicional
        info_adic = ET.SubElement(root, "infoAdicional")
        ET.SubElement(info_adic, "campoAdicional", nombre="email").text = invoice_data.get("email", "")

        return ET.tostring(root, encoding='unicode', method='xml')

    def sign_xml(self, xml_content: str) -> str:
        """Sign XML with digital certificate"""
        # This is a simplified version. In production, use proper XML signing
        # For now, return the XML as is (implement proper signing with xmlsec1)
        return xml_content

    def send_to_sri(self, signed_xml: str) -> dict:
        """Send signed XML to SRI for reception"""
        # SOAP envelope for SRI
        soap_envelope = f"""<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.recepcion">
   <soapenv:Header/>
   <soapenv:Body>
      <ec:validarComprobante>
         <xml>{base64.b64encode(signed_xml.encode()).decode()}</xml>
      </ec:validarComprobante>
   </soapenv:Body>
</soapenv:Envelope>"""

        headers = {
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': ''
        }

        try:
            response = requests.post(self.recepcion_url, data=soap_envelope, headers=headers, timeout=30)
            return self._parse_sri_response(response.text)
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def check_authorization(self, access_key: str) -> dict:
        """Check authorization status from SRI"""
        soap_envelope = f"""<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ec="http://ec.gob.sri.ws.autorizacion">
   <soapenv:Header/>
   <soapenv:Body>
      <ec:autorizacionComprobante>
         <claveAccesoComprobante>{access_key}</claveAccesoComprobante>
      </ec:autorizacionComprobante>
   </soapenv:Body>
</soapenv:Envelope>"""

        headers = {
            'Content-Type': 'text/xml; charset=utf-8',
            'SOAPAction': ''
        }

        try:
            response = requests.post(self.autorizacion_url, data=soap_envelope, headers=headers, timeout=30)
            return self._parse_authorization_response(response.text)
        except Exception as e:
            return {"status": "error", "message": str(e)}

    def _parse_sri_response(self, response_xml: str) -> dict:
        """Parse SRI reception response"""
        # Simplified parsing
        if "RECIBIDA" in response_xml:
            return {"status": "received", "message": "Comprobante recibido"}
        elif "DEVUELTA" in response_xml:
            return {"status": "rejected", "message": "Comprobante devuelto"}
        else:
            return {"status": "unknown", "message": "Respuesta desconocida"}

    def _parse_authorization_response(self, response_xml: str) -> dict:
        """Parse SRI authorization response"""
        # Simplified parsing
        if "AUTORIZADO" in response_xml:
            return {"status": "authorized", "message": "Comprobante autorizado"}
        elif "NO AUTORIZADO" in response_xml:
            return {"status": "not_authorized", "message": "Comprobante no autorizado"}
        else:
            return {"status": "processing", "message": "En proceso"}