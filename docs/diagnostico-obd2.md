# Diagnóstico OBD2 — Valores mostrados en la UI

Referencia de todos los valores que se leen del vehículo a través del adaptador ELM327 y se muestran en la pantalla de Diagnóstico de la app.

---

## Vista principal (siempre visible al conectar)

Estos valores se muestran en el grid de tarjetas principal inmediatamente al conectarse. Se actualizan cada ~3 segundos (Tier Rápido).

| Valor | PID OBD2 | Unidad | Fórmula | Rango normal |
|-------|----------|--------|---------|--------------|
| RPM | 010C | rpm | ((A * 256) + B) / 4 | 700–900 rpm (ralentí), hasta ~6.000–7.000 rpm |
| Velocidad | 010D | km/h | Byte A directo | 0–220 km/h |
| Temperatura (refrigerante) | 0105 | °C | A - 40 | 80–105 °C (en operación normal). < 70 °C = motor frío, > 110 °C = sobrecalentamiento |
| Batería | AT RV | V | Regex del string "XX.XV" | 12.4–14.7 V. < 12.0 V = batería baja, > 14.8 V = posible sobrecarga del alternador |
| Carga Motor | 0104 | % | (A * 100) / 255 | 15–30% (ralentí), 60–80% (aceleración fuerte). 0% = motor apagado, 100% = máxima demanda |
| Combustible (nivel) | 012F | % | (A * 100) / 255 | 0–100%. La precisión depende del sensor del tanque |

> **Nota:** Carga Motor y Combustible solo aparecen si el vehículo reporta soporte para los PIDs 04 y 2F respectivamente.

---

## Sección expandible "Ver más datos"

Estos valores se muestran al tocar "Ver más datos". Están organizados en tres subgrupos.

### Eficiencia

Se muestran si el vehículo soporta PID 5E (consumo directo) o PID 10 (flujo de aire MAF). Se actualizan cada ~10 segundos (Tier Medio).

| Valor | PID OBD2 | Unidad | Fórmula | Rango normal |
|-------|----------|--------|---------|--------------|
| Consumo | 015E o calculado desde MAF | L/100km | PID 5E: ((A * 256) + B) / 20 = L/h, luego convertido a L/100km usando velocidad. Si no hay 5E, se estima desde MAF: (MAF * 3600) / (densidad * estequiometría) | 5–8 L/100km (ciudad), 4–6 L/100km (ruta). Varía según motor y tipo de conducción |
| Flujo Aire (MAF) | 0110 | g/s | ((A * 256) + B) / 100 | 2–5 g/s (ralentí), 15–50 g/s (aceleración), hasta 150+ g/s (motores grandes a fondo) |
| Avance Encendido | 010E | ° (grados antes del PMS) | (A / 2) - 64 | 5–15° (ralentí), 20–40° (crucero). Valores negativos = retardo por detonación |

### Motor

Detalles internos del motor. Se actualizan en Tier Medio (~10s) o Tier Lento (~30s) según el parámetro.

| Valor | PID OBD2 | Unidad | Fórmula | Rango normal |
|-------|----------|--------|---------|--------------|
| Aire Admisión (temperatura) | 010F | °C | A - 40 | Similar a temperatura ambiente (20–40 °C). > 50 °C podría indicar problemas en el intercooler o flujo de aire restringido |
| Presión Colector (MAP) | 010B | kPa | Byte A directo | 20–35 kPa (ralentí, motor aspirado), ~100 kPa (aceleración a fondo = presión atmosférica). Turbos pueden superar 100 kPa |
| Acelerador (posición) | 0111 | % | (A * 100) / 255 | 0% = cerrado (pie fuera del pedal), 10–20% (crucero), 80–100% (aceleración a fondo) |
| Voltaje ECU | 0142 | V | ((A * 256) + B) / 1000 | 12.0–14.7 V (similar a batería). Refleja el voltaje que recibe el módulo de control del motor |
| Temp. Aceite | 015C | °C | A - 40 | 80–120 °C (operación normal). < 70 °C = motor frío (no exigir), > 130 °C = sobrecalentamiento. No confundir con temperatura del refrigerante: el aceite tarda más en calentar y es el indicador real de cuándo se puede exigir el motor |

### Viaje

Datos acumulativos del viaje o del historial del vehículo. Se actualizan cada ~30 segundos (Tier Lento).

| Valor | PID OBD2 | Unidad | Fórmula | Rango normal |
|-------|----------|--------|---------|--------------|
| Motor Encendido | 011F | min:seg | (A * 256) + B (en segundos, convertido a mm:ss para display) | Incrementa desde 0 al encender el motor. Se reinicia cada vez que se apaga el vehículo |
| Km sin Reset | 0131 | km | (A * 256) + B | Kilómetros recorridos desde el último borrado de códigos de error. Puede ser 0 si se resetearon recientemente, o miles de km |
| Temp. Ambiente | 0146 | °C | A - 40 | Depende del clima. -40 a 60 °C (rango del sensor). Lectura confiable solo si el vehículo está en movimiento |

> **Nota:** Cada valor de esta sección solo se muestra si el vehículo reporta soporte para el PID correspondiente. Los PIDs no soportados se omiten automáticamente.

---

## Sección "Kilometraje"

Se muestra entre el grid principal de telemetría y la sección "Ver más datos". Permite evaluar la consistencia del kilometraje del vehículo.

### Odómetro digital (PID 01A6)

| Valor | PID OBD2 | Unidad | Fórmula | Disponibilidad |
|-------|----------|--------|---------|----------------|
| Odómetro | 01A6 | km | ((A * 16777216) + (B * 65536) + (C * 256) + D) / 10 | SAE J1979-DA (2019+). Soporte limitado a vehículos recientes |

- Se lee **una sola vez** al conectar (no se actualiza en polling)
- Si el vehículo lo soporta, muestra el kilometraje real almacenado en la ECU
- Si no lo soporta (la mayoría de vehículos pre-2019), se omite y se muestra una nota explicativa

### Indicadores indirectos de consistencia

Estos valores ya se leen como parte de la telemetría regular y se muestran en esta sección para facilitar la evaluación del kilometraje:

| Valor | PID OBD2 | Utilidad para verificación |
|-------|----------|---------------------------|
| Km desde último reset DTC | 0131 | Si el vehículo dice tener 150.000 km y este valor es 148.000, nunca se borraron códigos (coherente). Si dice 2.000 km, alguien reseteó recientemente (sospechoso) |
| Km con Check Engine | 0121 | Solo se muestra si > 0. Indica cuántos km se recorrieron con la luz de falla encendida |

> **Nota:** Ninguno de estos valores reemplaza una verificación profesional del kilometraje. Son indicadores que pueden ayudar a detectar inconsistencias evidentes.

---

## Escaneo de errores (DTC)

Al presionar "Escanear errores (DTC)", la app envía el comando **Mode 03** al vehículo para leer los códigos de falla almacenados en la memoria de la ECU.

### Formato de los códigos DTC

Cada código DTC tiene 5 caracteres con el formato `XNNNN`:

| Prefijo | Categoría | Ejemplo |
|---------|-----------|---------|
| **P** | Powertrain (motor, transmisión) | P0300 — Fallo de encendido aleatorio |
| **C** | Chassis (chasis, frenos, dirección) | C0035 — Sensor de velocidad rueda izq. |
| **B** | Body (carrocería, airbags, A/C) | B0001 — Circuito del airbag conductor |
| **U** | Network (comunicación entre módulos) | U0100 — Pérdida de comunicación con ECM |

### Resultados posibles

- **Sin errores detectados:** El vehículo no reportó códigos de falla almacenados.
- **N código(s) encontrado(s):** Se muestra cada DTC con su código y una descripción legible (basada en un diccionario local de códigos conocidos).

> **Nota:** La app actualmente lee DTCs pero no los borra. El borrado de códigos requiere el comando Mode 04, que no está implementado.

---

## Tiers de actualización

La app usa un sistema de polling escalonado para balancear frescura de datos vs. capacidad del enlace serial:

| Tier | Intervalo | Valores |
|------|-----------|---------|
| **Rápido** | ~3 segundos | RPM, Velocidad, Temperatura refrigerante, Carga Motor, Acelerador, Batería (AT RV) |
| **Medio** | ~10 segundos (cada 3 ticks) | Aire Admisión, Flujo Aire MAF, Presión Colector, Consumo directo, Avance Encendido |
| **Lento** | ~30 segundos (cada 10 ticks) | Combustible, Temp. Ambiente, Temp. Aceite, Motor Encendido, Km sin Reset, Distancia con MIL, Voltaje ECU |

---

## Valores internos (no mostrados en UI directamente)

Estos valores se leen y almacenan pero no tienen tarjeta visible en la interfaz. Se guardan cuando el usuario graba un diagnóstico al historial.

| Valor | PID OBD2 | Descripción |
|-------|----------|-------------|
| Distancia con MIL encendida | 0121 | Kilómetros recorridos con Check Engine encendido. Se muestra en la sección Kilometraje si > 0 |
| Consumo directo (L/h) | 015E | Tasa de consumo bruta en litros por hora. Usado internamente para calcular L/100km |
| Tipo de combustible | 0151 | Leído una vez al conectar. Valores: gasolina, diésel, CNG, LPG, eléctrico, híbrido, desconocido |
| Odómetro | 01A6 | Leído una vez al conectar. Se muestra en la sección Kilometraje si el vehículo lo soporta (2019+) |

---

## Datos guardados al historial

Al presionar "Grabar el análisis al historial", se captura un snapshot que incluye:

- **DTCs:** Lista de códigos encontrados (o null si no se escaneó)
- **Telemetría:** Snapshot de los 19 valores de `LiveTelemetryData` en ese instante
- **Tipo de combustible:** Detectado al conectar
- **Traducción IA:** Campo opcional para análisis futuro con IA (Premium)
- **Vehículo y kilometraje:** Asociado al vehículo seleccionado del perfil del usuario
