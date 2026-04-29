import React from 'react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Política de Privacidad</h1>
        
        <div className="space-y-6 text-gray-600">
          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">1. Introducción</h2>
            <p>
              En Pivot Soluciones ("nosotros", "nuestro"), valoramos su privacidad y nos comprometemos a proteger sus datos personales. 
              Esta Política de Privacidad explica cómo recopilamos, utilizamos, divulgamos y salvaguardamos su información cuando utiliza 
              nuestro servicio Pivot Agents y nuestra aplicación web ("Servicio"), así como sus derechos sobre sus datos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">2. Información que Recopilamos</h2>
            <p className="mb-2">A través del uso de nuestro Servicio, podemos recopilar los siguientes tipos de información:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Información de Cuenta:</strong> Nombre, correo electrónico, identificadores proporcionados por servicios de terceros como Google Login.</li>
              <li><strong>Datos de Meta / Facebook:</strong> Cuando vincula su cuenta a través de "Facebook Login for Business" o "WhatsApp Embedded Signup", obtenemos acceso al Identificador de Usuario (ID) de Meta, nombre comercial, números de teléfono vinculados a WhatsApp Business, y permisos relacionados con la gestión y mensajería de WhatsApp Business (`whatsapp_business_management`, `whatsapp_business_messaging`).</li>
              <li><strong>Datos de Uso:</strong> Información sobre cómo interactúa con nuestros agentes de IA.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">3. Uso de la Información</h2>
            <p className="mb-2">Utilizamos la información recopilada para los siguientes propósitos:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Proveer, mantener y mejorar nuestro Servicio.</li>
              <li>Habilitar la integración de su cuenta de WhatsApp Business para que nuestros agentes de IA puedan responder mensajes en su nombre.</li>
              <li>Gestionar sus configuraciones de Meta y activos empresariales conforme a los permisos otorgados.</li>
              <li>Enviar notificaciones técnicas, de seguridad o administrativas importantes.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">4. Compartir Información con Terceros</h2>
            <p>
              No vendemos, alquilamos ni comercializamos su información personal. Solo compartimos su información con servicios de terceros estrictamente necesarios para la operación de la plataforma, como proveedores de alojamiento en la nube, la API de Meta (WhatsApp) y nuestro proveedor de motores de IA (OpenClaw), los cuales están sujetos a estrictas obligaciones de confidencialidad.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">5. Retención de Datos</h2>
            <p>
              Retenemos su información personal y tokens de acceso de Meta solo durante el tiempo que su cuenta esté activa o según sea necesario para proporcionarle el Servicio. Si decide eliminar su cuenta, eliminaremos o anonimizaremos sus datos de manera segura en nuestros servidores, de conformidad con las leyes aplicables.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">6. Eliminación de Datos del Usuario (Instrucciones de Borrado)</h2>
            <p className="mb-2">
              Usted tiene el derecho absoluto de solicitar la eliminación de todos sus datos almacenados en nuestra plataforma, incluyendo la información obtenida a través de Meta/Facebook. Para hacerlo:
            </p>
            <ol className="list-decimal pl-6 space-y-2">
              <li>Envíe un correo electrónico a <strong>codigoscreativos2025@gmail.com</strong> indicando que desea la eliminación de su cuenta y sus datos.</li>
              <li>También puede revocar los permisos directamente desde su cuenta de Meta en la sección de <strong>"Integraciones comerciales"</strong> de su perfil. Al hacer esto, revocará el acceso de nuestra aplicación a su cuenta de Meta de inmediato.</li>
              <li>En un plazo máximo de 7 días hábiles tras recibir su solicitud directa, todos sus datos personales, identificadores de cuenta y tokens de acceso serán eliminados permanentemente de nuestras bases de datos.</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">7. Seguridad de los Datos</h2>
            <p>
              Implementamos medidas técnicas y organizativas para proteger su información contra acceso no autorizado, alteración, divulgación o destrucción. 
              El acceso a sus tokens de Meta y credenciales de API se cifra de forma segura.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">8. Cambios a esta Política</h2>
            <p>
              Nos reservamos el derecho de actualizar esta Política de Privacidad en cualquier momento. Notificaremos cualquier cambio importante en nuestra plataforma o a través de correo electrónico. El uso continuado del Servicio constituirá su aceptación de dichas modificaciones.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-800 mb-3">9. Contacto</h2>
            <p>
              Si tiene alguna pregunta, inquietud o solicitud respecto a esta Política de Privacidad o sus datos, por favor contáctenos en:
              <br/><br/>
              <strong>Correo electrónico:</strong> codigoscreativos2025@gmail.com
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
