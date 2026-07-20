
window.ASSET_CONFIG={
  extensions:["png","webp","jpg","svg"],

  // Os Pals e itens são automáticos; o nome vem diretamente da base.
  palsDirectory:"assets/pals",
  itemsDirectory:"assets/items",
  elementsDirectory:"assets/elements",
  workDirectory:"assets/work",
  otherDirectory:"assets/icons_other",

  /*
   * Preencha estes mapas quando identificar os arquivos.
   * Pode informar com ou sem extensão.
   *
   * Exemplo:
   * Water:"T_Icon_element_s_04"
   */
  elements:{
    Normal:"",
    Fire:"",
    Water:"",
    Grass:"",
    Leaf:"",
    Electric:"",
    Electricity:"",
    Ice:"",
    Ground:"",
    Earth:"",
    Dark:"",
    Dragon:""
  },

  /*
   * Se o baixador encontrar ícones reais de trabalho, associe aqui.
   * Enquanto estiver vazio, o site mostra o símbolo temporário.
   */
  work:{
    Handcraft:"",
    Handiwork:"",
    Transport:"",
    Transporting:"",
    Mining:"",
    Gathering:"",
    Watering:"",
    Lumbering:"",
    Planting:"",
    Kindling:"",
    Cooling:"",
    Electricity:"",
    GeneratingElectricity:"",
    Medicine:"",
    MedicineProduction:"",
    Farming:"",
    OilExtraction:""
  }
};
