import { emptyBox, includePoint } from './primitives.js';

function drawCountries(countries, origin) {
  const land = new Path2D();
  for (const country in countries) {
    for (const ring of countries[country]) {
      let x = 0;
      let y = 0;
      for (let i = 0; i < ring.length; i += 2) {
        x += ring[i];
        y += ring[i + 1];
        const point = [x - origin[0], -y - origin[1]];
        if (i) land.lineTo(...point);
        else land.moveTo(...point);
      }
      land.closePath();
    }
  }
  return land;
}

function createCities(exterior, fields, origin, box) {
  return exterior.cidades.map((row, index) => {
    const point = [row[fields.x] - origin[0], -row[fields.y] - origin[1]];
    includePoint(box, point);
    return {
      i: index,
      cd: String(row[fields.cd]),
      name: row[fields.nome],
      country: row[fields.pais],
      iso: row[fields.iso],
      el: row[fields.el],
      opens: row[fields.abre],
      closes: row[fields.fecha],
      c: point,
    };
  });
}

export function createWorld(world, exterior, origin) {
  if (!world || !exterior) return null;
  const box = emptyBox();
  const fields = Object.fromEntries(
    exterior.campos.map((name, index) => [name, index]),
  );
  const cities = createCities(exterior, fields, origin, box);
  const countries = exterior.paises.map(([iso, name, n, el]) => ({
    iso,
    name,
    n,
    el,
    cities: cities.filter((city) => city.iso === iso).map((city) => city.i),
  }));
  for (const country of countries) {
    country.box = emptyBox();
    for (const index of country.cities)
      includePoint(country.box, cities[index].c);
  }
  return {
    land: drawCountries(world.paises, origin),
    cities,
    countries,
    box,
    F: fields,
  };
}
