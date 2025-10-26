import re
import json

with open('Mapa Interativo Grupo Progresso - Safra 2025-26.html', 'r', encoding='utf-8') as f:
    html = f.read()

# Encontrar todas as chamadas geo_json_XXX_add com o ID único
geo_pattern = r'(geo_json_([a-f0-9]+))_add\((\{"features":.*?"FeatureCollection"\})\);'
geo_matches = re.findall(geo_pattern, html, re.DOTALL)

print(f"Total de GeoJSON encontrados: {len(geo_matches)}")

# Encontrar todos os tooltips com talhão
tooltip_pattern = r'(geo_json_([a-f0-9]+))\.bindTooltip.*?Talhão:.*?>(\w+)</td>.*?Cultura:.*?>(\w+)</td>.*?Área \(ha\):.*?>([\d.]+)</td>'
tooltip_matches = re.findall(tooltip_pattern, html, re.DOTALL)

print(f"Total de tooltips encontrados: {len(tooltip_matches)}")

# Criar mapeamento ID -> tooltip info
tooltip_map = {}
for var_name, hash_id, talhao, cultura, area in tooltip_matches:
    tooltip_map[hash_id] = {
        'talhao': talhao,
        'cultura': cultura,
        'area': float(area)
    }

# Processar GeoJSON
cotton_talhaos = ['1B', '2B', '3B', '4B', '5B', '2A', '3A', '4A', '5A']
cotton_features = []
other_features = []

for var_name, hash_id, geojson_str in geo_matches:
    try:
        clean_json = re.sub(r'\s+', ' ', geojson_str)
        geojson_data = json.loads(clean_json)
        
        if 'features' not in geojson_data or len(geojson_data['features']) == 0:
            continue
        
        feature = geojson_data['features'][0]
        
        # Buscar informações no mapa de tooltips
        if hash_id in tooltip_map:
            info = tooltip_map[hash_id]
            talhao_nome = info['talhao']
            cultura = info['cultura']
            area = info['area']
            
            properties = {
                'nome': talhao_nome,
                'cultura': cultura,
                'area': area,
                'isCotton': talhao_nome in cotton_talhaos and cultura == 'Algodão'
            }
            
            feature['properties'] = properties
            
            if properties['isCotton']:
                cotton_features.append(feature)
                print(f"✓ Algodão {talhao_nome}: {area} ha")
            else:
                other_features.append(feature)
                
    except (json.JSONDecodeError, ValueError) as e:
        print(f"Erro: {e}")
        continue

print(f"\n✓ Total de talhões de algodão: {len(cotton_features)}")
print(f"✓ Total de outros talhões: {len(other_features)}")

# Criar FeatureCollections
cotton_geojson = {
    "type": "FeatureCollection",
    "features": cotton_features
}

other_geojson = {
    "type": "FeatureCollection",
    "features": other_features
}

# Criar arquivo TypeScript
ts_content = f"""// GeoJSON dos talhões extraídos do mapa da safra 2025-26
// Gerado automaticamente por extract-geojson.py

import {{ FeatureCollection, Feature, Polygon }} from 'geojson';

// Talhões de Algodão (destacados)
export const cottonTalhoes: FeatureCollection<Polygon> = {json.dumps(cotton_geojson, indent=2, ensure_ascii=False)};

// Outros Talhões (desfocados)
export const otherTalhoes: FeatureCollection<Polygon> = {json.dumps(other_geojson, indent=2, ensure_ascii=False)};

// Todas as features combinadas
export const allTalhoes: FeatureCollection<Polygon> = {{
  type: "FeatureCollection",
  features: [...cottonTalhoes.features, ...otherTalhoes.features]
}};
"""

output_file = 'client/src/data/talhoes-geojson.ts'
with open(output_file, 'w', encoding='utf-8') as f:
    f.write(ts_content)

print(f"\n✓ Arquivo salvo em: {output_file}")

# Resumo
print("\n=== TALHÕES DE ALGODÃO ===")
for feature in sorted(cotton_features, key=lambda f: f['properties']['nome']):
    props = feature['properties']
    print(f"- {props['nome']}: {props['area']} ha")
