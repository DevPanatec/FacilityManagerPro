import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const organizationId = 'e7ddbbd4-a30f-403c-b219-d9660014a799'

const supabase = createClient(supabaseUrl, supabaseKey)

const inventoryData = [
  { id: 1, name: 'JABON DE LAVAR', unit: 'UNIDADES' },
  { id: 2, name: 'BOTELLA PLASTICA CON ATOMIZADOR 32 OZ', unit: 'UNIDADES' },
  { id: 3, name: 'FELPA MARRON PARA PULPO', unit: 'UNIDADES' },
  { id: 4, name: 'PORTA PAD CON MANGO MADERA Y PAD', unit: 'UNIDADES' },
  { id: 5, name: 'ESPONJA CON BRILLO VERDE (GRUESA)', unit: 'UNIDADES' },
  { id: 6, name: 'MOTA DE LAMPAZO VERDE DE MICROFIBRA', unit: 'UNIDADES' },
  { id: 7, name: 'LAMPAZO DE MICROFIBRA CON FELPA CELESTE COMPLETO', unit: 'UNIDADES' },
  { id: 8, name: 'GAFAS DE PROTECCION PARA LIMPIEZA', unit: 'UNIDADES' },
  { id: 9, name: 'MOTA DE LAMPAZO ROJA DE MICROFIBRA', unit: 'UNIDADES' },
  { id: 10, name: 'MOTA DE LAMPAZO AMARILLO DE MICROFIBRA', unit: 'UNIDADES' },
  { id: 11, name: 'CEPILLO DE INODOROS', unit: 'UNIDADES' },
  { id: 12, name: 'ESCOBILLONES PARA PISOS', unit: 'UNIDADES' },
  { id: 13, name: 'CEPILLOS LAVAR', unit: 'UNIDADES' },
  { id: 14, name: 'EMULSOL', unit: 'GALONES' },
  { id: 15, name: 'BEAKTHRU', unit: 'BOTELLA' },
  { id: 16, name: 'NEUTRAL MIX (FLORAL)', unit: 'TANQUES 5GL' },
  { id: 17, name: 'SPRAY 3M PARA ALUMINIO (3M)', unit: 'UNIDADES' },
  { id: 18, name: 'CEPILLOS MULTIUSOS', unit: 'UNIDADES' },
  { id: 19, name: 'GUANTES DE HULE (AMARILLO)', unit: 'TALLA LARGE' },
  { id: 20, name: 'GUANTES DE NITRILO (VERDE O TURQUESA)', unit: 'TALLA LARGE' },
  { id: 21, name: 'GUANTES DE CAUCHO DE 18" (HULE)', unit: 'TALLA LARGE' },
  { id: 22, name: 'MOPA DE TRAPEADOR VERDE', unit: 'MEDIANA' },
  { id: 23, name: 'MOPA DE TRAPEADOR ROJA', unit: 'MEDIANA', quantity: 3 },
  { id: 24, name: 'MOPA DE TRAPEADOR AZUL', unit: 'MEDIANA', quantity: 1 },
  { id: 25, name: 'LIJA DE AGUA', unit: '#120' },
  { id: 26, name: 'RASTRILLO PLASTICO 23 DIENTES', unit: 'JAR-014' },
  { id: 27, name: 'DUAL SURFACE 10" CON SQUEGEE', unit: 'UNIDADES' },
  { id: 28, name: 'ESCURRIDORES DE AGUA PARA PISOS', unit: 'UNIDADES' },
  { id: 29, name: 'ALCOHOL', unit: 'GALONES' },
  { id: 30, name: 'DELANTAL DE POLIETOLENO CON TIRANTES', unit: 'CAJAS DE 100 UNI' },
  { id: 31, name: 'CAPOTES AMARILLOS (PARA LA LLUVIA)', unit: 'UNIDADES' },
  { id: 32, name: 'BOTAS DE CAUCHO NEGRAS TALLAS 41 (HOMBRE)', unit: 'PARES' },
  { id: 33, name: 'BOTAS DE CAUCHO NEGRAS TALLAS 36 (MUJER)', unit: 'PARES' },
  { id: 34, name: 'BOTAS DE CAUCHO NEGRAS TALLAS 37 (MUJER)', unit: 'PARES' },
  { id: 35, name: 'BOTAS DE CAUCHO NEGRAS TALLAS 38 (HOMBRE)', unit: 'PARES' },
  { id: 36, name: 'BOTAS DE CAUCHO NEGRAS TALLAS 40 (HOMBRE)', unit: 'PARES' },
  { id: 37, name: 'BLITZ', unit: 'UNIDADES' },
  { id: 38, name: 'MILDEX', unit: 'UNIDADES' },
  { id: 39, name: 'ESPATULAS PARA REMOVER CERAS', unit: 'UNIDADES' },
  { id: 40, name: 'CLOROX (HIPOCLORITO)', unit: 'GALONES' },
  { id: 41, name: 'MANGO DE ALUMINIO DE LAMPAZO PARA BARRER (SOLO EL PALO)', unit: 'UNIDADES' },
  { id: 42, name: 'BRILLO DE ALAMBRE', unit: 'UNIDADES' },
  { id: 43, name: 'PORTA FELPA PARA LIMP. DE VIDRIOS (T)', unit: 'UNIDADES' },
  { id: 44, name: 'FELPA DE RESPUESTO PARA ES DE VIDRIOS (T)', unit: 'UNIDADES' },
  { id: 45, name: 'BOMBA PARA GALON', unit: 'UNIDADES' },
  { id: 46, name: 'MANGO DE ALUMINIO PARA LAMPAZO DE MICROFIBRA (COMPLETOS)', unit: 'UNIDADES' },
  { id: 47, name: 'MARCO PAR ALAMPAZO DE MICROFIBRA 18"', unit: 'UNIDADES' },
  { id: 48, name: 'MOTA DE LAMPAZO DE MICROFIBRA (PARA BARRER AZUL)', unit: 'UNIDADES', quantity: 4 },
  { id: 49, name: 'MEDIDOR DE POLVO', unit: 'UNIDADES' },
  { id: 50, name: 'CUBOS', unit: 'PEQUEÑOS' },
  { id: 51, name: 'CONTENEDORES PARA DESECHOS CON RUEDAS', unit: 'UNIDADES', quantity: 6 },
  { id: 52, name: 'TRAPOS', unit: '100 LBS' },
  { id: 53, name: 'ROLLO DE WAYPALL', unit: 'ROLLOS' },
  { id: 54, name: 'WAYPALL ROJA', unit: 'CAJAS', quantity: 5 },
  { id: 55, name: 'WAYPALL AZUL', unit: 'CAJAS', quantity: 21 },
  { id: 56, name: 'WAYPALL VERDE', unit: 'CAJAS', quantity: 5 },
  { id: 57, name: 'WAYPALL AMARILLA', unit: 'PAQUETES', quantity: 5 },
  { id: 58, name: 'SPRAY DESODORANTE AMBIENTAL SWEET', unit: 'UNIDADES' },
  { id: 59, name: 'SPRAY DESODORANTE AMBIENTAL LINE', unit: 'UNIDADES' },
  { id: 60, name: 'GUANTES DE NITRILO L', unit: 'CAJAS DE 100 UNI', quantity: 1 },
  { id: 61, name: 'GUANTES DE NITRILO XL', unit: 'CAJAS' },
  { id: 62, name: 'CUBO DE TRAPEADOR CON EXPRIMIDOR', unit: 'UNIDADES' },
  { id: 63, name: 'EXPRIMIDOR DE TRAPEADOR', unit: 'UNIDADES' },
  { id: 64, name: 'MASCARILLAS QUIRURGICAS', unit: 'CAJAS DE 50 UN.', quantity: 16 },
  { id: 65, name: 'RECOGEDOR ABIERTO', unit: 'UNIDADES' },
  { id: 66, name: 'MANGO DE TRAPEADOR CABEZAL PLASTICO AMARILLO', unit: 'UNIDADES' },
  { id: 67, name: 'ESCOBAS COMPLETA', unit: 'UNIDADES' },
  { id: 68, name: 'BOLSAS TRANSPARENTES', unit: '23 X 30', quantity: 5 },
  { id: 69, name: 'BOLSAS TRANSPARENTES', unit: '32 X 40', quantity: 14 },
  { id: 70, name: 'BOLSAS ROJAS', unit: '23 X 30', quantity: 13 },
  { id: 71, name: 'BOLSAS ROJAS', unit: '32 X 40', quantity: 30 },
  { id: 72, name: 'CLORO ORGANICO', unit: 'CAJAS DE 50 UN.' },
  { id: 73, name: 'BATAS', unit: '160 uni', quantity: 1 },
  { id: 74, name: 'COBERTOR DE ZAPATOS', unit: 'UNIDADES', quantity: 2000 },
  { id: 75, name: 'GORROS', unit: 'UNIDADES', quantity: 2000 },
  { id: 76, name: 'VYREX', unit: 'GALONES' },
  { id: 77, name: 'MASCARILLAS N 95', unit: 'CAJAS DE 20 UN.', quantity: 20 },
  { id: 78, name: 'CHUPON DE BAÑO', unit: 'UNIDADES', quantity: 21 },
  { id: 79, name: 'BOMBA DE FUMIGAR', unit: 'UNIDADES' },
  { id: 80, name: 'COBERTOR CON CAPUCHA (MONQUIS)', unit: 'UNIDADES' },
  { id: 81, name: 'TIJERAS PARA TELA (TIJERAS GRANDES)', unit: 'UNIDADES' },
  { id: 82, name: 'BOLIGRAFOS', unit: 'CAJA' },
  { id: 83, name: 'CINTA ADHESIVA', unit: 'ROLLOS' },
  { id: 84, name: 'MASKING TAPE (CINTA ADHESIVA DE CREMA)', unit: 'ROLLOS' },
  { id: 85, name: 'MARCADOR PERMANENTE (PENTEL)', unit: 'UNIDAD' },
  { id: 86, name: 'CARPETAS 8 1/2 X 11', unit: 'CAJA' },
  { id: 87, name: 'CORRECTOR', unit: 'UNIDAD' },
  { id: 88, name: 'PAGINAS BLANCAS 8 1/2 X 11', unit: 'RESMAS' },
  { id: 89, name: 'PAGINAS BLANCAS 8 1/2 X 14', unit: 'RESMAS' },
  { id: 90, name: 'LYSOL', unit: 'UNIDADES' },
  { id: 91, name: 'FAROLA / AJAX', unit: 'UNIDADES' }
]

async function insertInventory() {
  try {
    const items = inventoryData.map(item => ({
      name: item.name,
      quantity: item.quantity || 0,
      unit: item.unit,
      organization_id: organizationId,
      category: 'cleaning_supplies',
      status: 'active' as const
    }))

    const { data, error } = await supabase
      .from('inventory_items')
      .insert(items)
      .select()

    if (error) {
      console.error('Error inserting inventory:', error)
      return
    }

    console.log('Successfully inserted inventory items:', data.length)
  } catch (error) {
    console.error('Error in insertInventory:', error)
  }
}

insertInventory() 