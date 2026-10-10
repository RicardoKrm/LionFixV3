import fs from 'node:fs';
import path from 'node:path';
import { jsPDF } from 'jspdf';

function generateClientJourneyPdf() {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;
  let y = 18;

  const checkPageBreak = (neededHeight = 25) => {
    if (y + neededHeight > pageHeight - 16) {
      doc.addPage();
      y = 18;
    }
  };

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 34, 'F');
  doc.setFillColor(245, 158, 11);
  doc.rect(0, 34, pageWidth, 2, 'F');

  doc.setTextColor(245, 158, 11);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('LIONFIX SERVICE ERP', margin, 15);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(12);
  doc.text('Manual Paso a Paso: Recorrido del Cliente y Flujo Operativo del Taller', margin, 23);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(
    'Desde el agendamiento online hasta la entrega del vehiculo reparado | Produccion: https://lion-fix-v3.vercel.app',
    margin,
    29
  );

  y = 44;

  const steps = [
    {
      badge: 'PASO 1',
      title: 'Agendamiento Online (Desde el Celular o PC del Cliente)',
      color: [16, 185, 129],
      clientActions: [
        'Entra a la pagina principal (/) y baja a la seccion Agenda (Formulario interactivo de 4 pasos).',
        'Paso 1 (Vehiculo): Ingresa Patente, Tipo de Vehiculo, Marca, Modelo y Kilometraje.',
        'Paso 2 (Servicio): Selecciona Mantencion, Diagnostico / Scanner, Reparacion General o Desabolladura y Pintura.',
        'Paso 3 (Fecha y Hora): Elige el dia disponible en el calendario y el bloque horario (ej. 09:00, 11:30, 15:00).',
        'Paso 4 (Contacto): Ingresa Nombre, RUT, Correo y Telefono (WhatsApp).',
        'Recibe en pantalla su Codigo de Reserva unico de 6 caracteres (ej. A8F3K9) para consultar su cita en cualquier momento.',
      ],
      softwareActions: [
        'La cita se guarda automaticamente en la tabla "appointments" de Supabase.',
        'Aparece de inmediato en el modulo Calendario (/dashboard/calendar) como tarjeta AGENDA.',
        'El jefe de taller arrastra la tarjeta al bloque horario del mecanico asignado (ej. Carlos Munoz).',
      ],
    },
    {
      badge: 'PASO 2',
      title: 'Llegada al Taller y Recepcion Digital (Checklist + Fotos)',
      color: [245, 158, 11],
      clientActions: [
        'Llega al taller el dia de su cita y entrega las llaves de su vehiculo.',
        'Junto al recepcionista revisan el estado exterior e interior (nivel de combustible, rayones previos, documentos y objetos de valor).',
      ],
      softwareActions: [
        'Si es cliente nuevo, se registra en Clientes (/dashboard/clients/new) junto con su vehiculo y acceso opcional al Portal de Cliente (/login).',
        'En Checklists (/dashboard/management/checklists), el taller crea un Nuevo Checklist de Recepcion.',
        'Se marcan los 10 puntos de inspeccion y se suben fotos reales de entrada y portada directamente a Supabase Storage.',
      ],
    },
    {
      badge: 'PASO 3',
      title: 'Diagnostico, Presupuesto Digital y Aprobacion por WhatsApp',
      color: [249, 115, 22],
      clientActions: [
        'Recibe un mensaje automatico en su WhatsApp con el monto total y un enlace directo a su presupuesto digital (/quote/[id]).',
        'Abre el enlace en su celular: visualiza los datos de su vehiculo, el desglose de repuestos y mano de obra, y el total.',
        'Presiona el boton verde "Aprobar Cotizacion" (o "Rechazar") directamente desde su telefono o desde su Portal (/portal/dashboard).',
      ],
      softwareActions: [
        'El taller crea el presupuesto en Cotizaciones -> Nuevo Presupuesto (/dashboard/finance/quotes/new) con diagnostico y firma.',
        'Envia el enlace con el boton "Enviar por WhatsApp" o descarga el documento formal con "Descargar PDF".',
        'Al aprobar el cliente, el estado cambia a "Aprobada" y se habilita el boton "Convertir a OT", que genera la Orden de Trabajo (OT) en 1 clic.',
      ],
    },
    {
      badge: 'PASO 4',
      title: 'Reparacion en Taller y Seguimiento en Tiempo Real',
      color: [59, 130, 246],
      clientActions: [
        'Puede ingresar en cualquier momento a su Portal de Cliente (/portal/vehicles) para ver en que etapa exacta se encuentra su vehiculo.',
        'Consulta el historial clinico automotriz de su patente con total transparencia.',
      ],
      softwareActions: [
        'El vehiculo ocupa una de las 6 Estaciones de Trabajo monitoreadas en vivo en el Panel de Control (/dashboard).',
        'El mecanico consulta pares de apriete (Nm), fluidos y diagramas en Manuales & Torques + Ventana Directa HaynesPro (/dashboard/manuals).',
        'En la Orden de Trabajo (/dashboard/work-orders/[id]) registra repuestos de Inventario, codigos OBD-II y avances en la Bitacora de Servicio.',
        'Actualiza el estado paso a paso: Ingresado -> En Diagnostico -> Esperando Repuestos -> En Reparacion -> Listo para Retiro.',
      ],
    },
    {
      badge: 'PASO 5',
      title: 'Control de Calidad de Salida, Entrega y Encuesta de Satisfaccion',
      color: [168, 85, 247],
      clientActions: [
        'Recibe su vehiculo reparado junto con el respaldo fotografico de entrada/salida y el detalle de los trabajos ejecutados.',
        'Califica la atencion de 1 a 5 estrellas y deja su comentario en la Encuesta de Satisfaccion.',
      ],
      softwareActions: [
        'Al finalizar la reparacion, el taller ejecuta el Checklist de Entrega en /dashboard/management/checklists (limpieza, luces, fluidos, boleta/factura y fotos de salida).',
        'Al guardar el Checklist de Entrega completo, la Orden de Trabajo pasa automaticamente a estado "Entregado" y libera la estacion de trabajo.',
        'Toda la informacion queda respaldada en la base de datos y disponible para exportar a Excel en Reportes (/dashboard/finance/reports).',
      ],
    },
  ];

  for (const step of steps) {
    checkPageBreak(58);

    // Step Header Bar
    doc.setFillColor(step.color[0], step.color[1], step.color[2]);
    doc.roundedRect(margin, y, contentWidth, 8, 1.5, 1.5, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(`${step.badge}: ${step.title}`, margin + 3, y + 5.5);
    y += 12;

    // Client sub-section
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('Que hace / ve el Cliente:', margin + 2, y);
    y += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.8);
    doc.setTextColor(51, 65, 85);
    for (const item of step.clientActions) {
      const lines = doc.splitTextToSize(`• ${item}`, contentWidth - 6);
      checkPageBreak(lines.length * 4.2 + 2);
      doc.text(lines, margin + 4, y);
      y += lines.length * 4.2;
    }

    y += 2;

    // Software sub-section
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.text('Que pasa en el Software (LionFix Service ERP):', margin + 2, y);
    y += 4.5;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.8);
    doc.setTextColor(51, 65, 85);
    for (const item of step.softwareActions) {
      const lines = doc.splitTextToSize(`• ${item}`, contentWidth - 6);
      checkPageBreak(lines.length * 4.2 + 2);
      doc.text(lines, margin + 4, y);
      y += lines.length * 4.2;
    }

    y += 5;
  }

  // Footer
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text('LionFix Service ERP - Documento Oficial de Flujo de Cliente y Operacion', margin, pageHeight - 7);
    doc.text(`Pagina ${i} de ${totalPages}`, pageWidth - margin - 22, pageHeight - 7);
  }

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  const publicPath = path.resolve('public/Proceso_Cliente_LionFix_Service.pdf');
  const rootPath = path.resolve('../Proceso_Cliente_LionFix_Service.pdf');

  fs.writeFileSync(publicPath, pdfBuffer);
  fs.writeFileSync(rootPath, pdfBuffer);

  console.log(`✅ PDF generado exitosamente en:\n  1) ${rootPath}\n  2) ${publicPath}`);
}

generateClientJourneyPdf();
