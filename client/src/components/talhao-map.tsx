import { MapContainer, TileLayer, GeoJSON } from 'react-leaflet';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { cottonTalhoes, otherTalhoes } from '@/data/talhoes-geojson';

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface TalhaoMapProps {
  selectedTalhao?: string;
  onTalhaoClick?: (talhao: string) => void;
}

export function TalhaoMap({ selectedTalhao, onTalhaoClick }: TalhaoMapProps) {
  // Centro do mapa baseado nos talhões de algodão
  const center: [number, number] = [-7.49, -44.20];
  const zoom = 12;

  // Estilo para talhões de algodão (destacados)
  const cottonStyle = () => ({
    fillColor: '#22c55e',
    weight: 2,
    opacity: 1,
    color: '#16a34a',
    dashArray: '',
    fillOpacity: 0.7
  });

  // Estilo para outros talhões (desfocados/blur)
  const otherStyle = () => ({
    fillColor: '#9ca3af',
    weight: 1,
    opacity: 0.3,
    color: '#6b7280',
    dashArray: '',
    fillOpacity: 0.15
  });

  const onEachCottonFeature = (feature: any, layer: L.Layer) => {
    if (feature.properties) {
      const { nome, area, cultura } = feature.properties;
      
      layer.bindPopup(`
        <div class="p-2">
          <h3 class="font-bold text-lg mb-1">Talhão ${nome}</h3>
          <p class="text-sm"><b>Cultura:</b> ${cultura}</p>
          <p class="text-sm"><b>Área:</b> ${area?.toFixed(2)} ha</p>
        </div>
      `);
      
      layer.on({
        click: () => {
          if (onTalhaoClick) {
            onTalhaoClick(nome);
          }
        },
        mouseover: (e: L.LeafletMouseEvent) => {
          const target = e.target;
          target.setStyle({
            weight: 3,
            fillOpacity: 0.9
          });
        },
        mouseout: (e: L.LeafletMouseEvent) => {
          const target = e.target;
          target.setStyle(cottonStyle());
        }
      });
    }
  };

  const onEachOtherFeature = (feature: any, layer: L.Layer) => {
    if (feature.properties) {
      const { nome, area, cultura } = feature.properties;
      
      layer.bindPopup(`
        <div class="p-2 opacity-70">
          <h3 class="font-bold text-sm mb-1">Talhão ${nome}</h3>
          <p class="text-xs"><b>Cultura:</b> ${cultura}</p>
          <p class="text-xs"><b>Área:</b> ${area?.toFixed(2)} ha</p>
        </div>
      `);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Mapa dos Talhões - Safra 2025/26</CardTitle>
        <p className="text-sm text-muted-foreground">
          Talhões de Algodão destacados em verde. Clique para mais detalhes.
        </p>
      </CardHeader>
      <CardContent>
        <div style={{ height: '600px', width: '100%' }} className="rounded-lg overflow-hidden border">
          <MapContainer
            center={center}
            zoom={zoom}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
              url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            
            {/* Outros talhões (soja e milho) - desfocados ao fundo */}
            <GeoJSON 
              data={otherTalhoes} 
              style={otherStyle}
              onEachFeature={onEachOtherFeature}
            />
            
            {/* Talhões de algodão - destacados */}
            <GeoJSON 
              data={cottonTalhoes} 
              style={cottonStyle}
              onEachFeature={onEachCottonFeature}
            />
          </MapContainer>
        </div>
        <div className="mt-4 flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500"></div>
            <span>Algodão ({cottonTalhoes.features.length} talhões)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-400 opacity-30"></div>
            <span>Outras culturas ({otherTalhoes.features.length} talhões)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
