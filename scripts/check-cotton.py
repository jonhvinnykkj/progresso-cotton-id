import re

with open('Mapa Interativo Grupo Progresso - Safra 2025-26.html', 'r', encoding='utf-8') as f:
    c = f.read()

cotton = ['1B', '2B', '3B', '4B', '5B', '2A', '3A', '4A', '5A']

for t in cotton:
    pattern = f'>{t}</td>'
    if pattern in c:
        idx = c.find(pattern)
        context = c[idx-200:idx+300]
        has_geojson = 'geo_json_' in context
        has_algodao = 'Algodão' in context
        print(f'{t}: GeoJSON={has_geojson}, Algodão={has_algodao}')
    else:
        print(f'{t}: NOT FOUND')
