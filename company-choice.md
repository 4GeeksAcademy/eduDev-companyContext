# Company Choice — TrackFlow

## Empresa elegida

Elegí **TrackFlow**, una empresa de logística de última milla y gestión de almacenes que opera entre Estados Unidos y España.

## Por qué elegí esta empresa

Elegí TrackFlow porque sus problemas combinan operaciones físicas reales con decisiones basadas en datos: inventario, pedidos, almacenes, carriers, entregas, costes, incidencias y devoluciones. Me interesa especialmente que no se trata solo de construir una aplicación, sino de diseñar sistemas que ayuden a tomar mejores decisiones logísticas en tiempo real. La empresa tiene dos almacenes que no comparten una vista unificada de inventario y trabaja con varios carriers cuyos datos de rendimiento no están centralizados. Eso hace que TrackFlow sea un contexto muy potente para aprender AI Engineering aplicado a automatización, optimización y recomendaciones explicables.

## Departamentos que más me interesan

### Last Mile and Carrier Management

Este departamento me interesa porque actualmente la asignación de carriers se hace de forma manual y el equipo tiene que revisar distintos portales para consultar el estado de los envíos. Además, TrackFlow no cuenta con datos históricos estructurados sobre entregas a tiempo, incidencias, coste por kilo o rendimiento por ruta. Me parece un área ideal para aplicar análisis de datos y construir un sistema que recomiende el mejor carrier según destino, peso, urgencia, coste y performance histórica.

### Warehouse Operations

Warehouse Operations también me resulta interesante porque los almacenes de Los Ángeles y Zaragoza funcionan con sistemas distintos y no tienen una visión global de inventario en tiempo real. Eso afecta directamente la planificación de pedidos, el picking, la disponibilidad de stock y la capacidad de cumplir entregas. Si los datos de inventario se integran correctamente, pueden alimentar mejores decisiones logísticas y hacer que el motor de recomendaciones para carriers sea mucho más preciso.

## Reto de automatización o IA que quiero construir

El reto de automatización que más me interesa construir es un **motor inteligente de selección de carriers**. La idea sería que TrackFlow pueda recomendar automáticamente el carrier más conveniente para cada envío usando datos como destino, peso, urgencia, almacén de origen, coste estimado, SLA del cliente, historial de entregas e incidencias previas. No quiero que el sistema sea una caja negra: debería explicar por qué recomienda un carrier y mostrar alternativas cuando haya riesgo de retraso o coste elevado.

## Mi idea de Agente de IA

Mi idea es construir un **Logistics Optimization Agent** para ayudar al equipo de Last Mile a tomar mejores decisiones de envío. El agente recibiría la información de un pedido nuevo, revisaría el stock disponible por almacén, el destino, el peso del paquete, la urgencia del envío y las reglas del cliente. Después consultaría datos históricos de carriers, como tiempos de entrega, incidencias por ruta, coste por kilo y cumplimiento de SLA.

Como resultado, el agente recomendaría el carrier más adecuado, explicaría la razón de la recomendación, indicaría un nivel de confianza y marcaría posibles riesgos, como retrasos frecuentes en una ruta o costes superiores al promedio. También podría sugerir una segunda alternativa si el carrier principal no estuviera disponible o si el envío tuviera una prioridad especial. Esto ayudaría a TrackFlow a reducir decisiones manuales, mejorar la puntualidad de las entregas y construir una base de datos útil para seguir optimizando la operación.
