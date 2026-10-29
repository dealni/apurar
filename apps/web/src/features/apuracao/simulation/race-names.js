/* Sequência compartilhada entre governadores e senadores simulados. */
const firstNames = [
  'Ana',
  'Beatriz',
  'Celso',
  'Dalva',
  'Edson',
  'Fabiana',
  'Gilberto',
  'Heloísa',
  'Ivo',
  'Jandira',
  'Lauro',
  'Márcia',
  'Nilton',
  'Odete',
  'Paulo',
  'Quitéria',
  'Rubens',
  'Sônia',
  'Tiago',
  'Valéria',
  'Wilson',
  'Yara',
  'Lourdes',
  'Moacir',
  'Teresa',
  'Raimundo',
  'Cleide',
  'Hélio',
  'Rosana',
  'Adauto',
  'Marlene',
  'Davi',
  'Neusa',
  'Otacílio',
  'Priscila',
  'Irene',
  'Jonas',
];
const lastNames = [
  'Arruda',
  'Bezerril',
  'Cavalcante',
  'Dantas',
  'Esteves',
  'Falcão',
  'Guedes',
  'Holanda',
  'Ibiapina',
  'Lacerda',
  'Macedo',
  'Nóbrega',
  'Ourique',
  'Paranhos',
  'Queiroga',
  'Rabelo',
  'Siqueira',
  'Uchôa',
  'Varela',
  'Bulhões',
  'Carneiro',
  'Damasceno',
  'Fagundes',
  'Linhares',
  'Meireles',
  'Pimentel',
  'Sampaio',
  'Vasconcelos',
  'Aragão',
  'Coutinho',
  'Albuquerque',
  'Brennand',
  'Castelo',
  'Dourado',
  'Figueiró',
  'Garcez',
  'Leitão',
];
const reservedNames = new Set([
  'Paulo Pimentel',
  'Ana Arruda',
  'Davi Brito',
  'Raimundo Lacerda',
  'Paulo Rabelo',
]);

export function createCandidateNames() {
  let nameSequence = 0;
  return () => {
    for (;;) {
      const index = nameSequence++;
      const firstName = firstNames[index % firstNames.length];
      const lastName =
        lastNames[
          (index * 11 + Math.floor(index / firstNames.length) + 5) %
            lastNames.length
        ];
      const name = firstName + ' ' + lastName;
      if (!reservedNames.has(name)) return name;
    }
  };
}
