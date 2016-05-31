canvas = document.getElementById("labyrinthe");
context = canvas.getContext('2d');
var generateBtn = document.getElementById('submitGen');
var loadBtn = document.getElementById('submitJson');
var exportBtn = document.getElementById('export');
var resolveBtn = document.getElementById('resolve');
var genrateForm = document.getElementById('formGen');
var loadForm = document.getElementById('formLoad');
var jsonInput =  document.getElementById('inputJson');
var jsonDiv =  document.getElementById('exportJson');
var error = document.getElementById('errorMessage');
var exportDiv = document.getElementById('displayExport');
var jsonFile = document.getElementById('fileJson');

var NB_COL = 0;
var NB_LINE = 0;
var COTE = 30;
var jsonL = ""; //JsonLoaded
var jsonLP = ""; //JsonLoadedParsed
var coordTab = []; //Look Up Table for coordinates
var laby = [];
var loadMode = false;

//Générer un laby aléatoirement de taille choisie
generateBtn.addEventListener('click', function(){
  coordTab = [];
  laby = [];
  error.innerHTML =""
  NB_COL = document.getElementById('nbrCol').value;
  NB_LINE = document.getElementById('nbrLine').value;
  if(NB_COL < 2 || NB_COL > 130 || NB_LINE < 2 || NB_LINE > 130){
    return error.innerHTML ="Les valeurs du labyrinthe doivent etre comprises entre 2 et 130 !";
  }
  for(i=0; i<NB_LINE*NB_COL; i++){
  coordTab[i] = {'line': Math.trunc(i/NB_COL) ,'col': i - (NB_COL * Math.trunc(i/NB_COL))};
  }
  loadMode = false;
  labyFunc(); 


}, false);

//Générer un laby avec un json
loadBtn.addEventListener('click', function(){
  jsonL = jsonInput.value;
  error.innerHTML = "";
//On vérifie que le json est valide
  valideJson = JSON.parse(jsonL);
  if(!valideJson.cells || !valideJson.width || !valideJson.height){
    return error.innerHTML = "Le json n'est pas valide";
  }

  coordTab = [];
  laby = [];
  var jsonTemp = jsonL.replace(/ /g, "");
  jsonLP = JSON.parse(jsonTemp);
  for(i=0; i<jsonLP.cells.length; i++){
    coordTab[i] = {'line': Math.trunc(i/jsonLP.width) ,'col': i - (jsonLP.height * Math.trunc(i/jsonLP.height))};
  }
  NB_COL = jsonLP.width;
  NB_LINE = jsonLP.height;
  loadMode = true;
  labyFunc();
}, false);

//Function principale
labyFunc = function(){
  canvas.width = COTE*NB_COL;
  canvas.height = COTE*NB_LINE;

  var WIDTH = canvas.width;
  var HEIGHT = canvas.height;

  // nb entier aleatoire dans [[min;max]]
  function randint(min, max) {
    return Math.floor(Math.random() * (max-min+1)) +min
  }

  /*++++++++++++++++++++++++++++++++++++++++++++++++++++++*/
  /*       La structure de données du labyrinthe          */
  /*++++++++++++++++++++++++++++++++++++++++++++++++++++++*/

  // Création de la grille du labyrinthe :
  var compteur = 1;

  for (var i=0; i<coordTab.length; i++) {
    laby[coordTab[i].line] = i%NB_COL==0 ? new Array() : laby[coordTab[i].line];
    laby[coordTab[i].line][coordTab[i].col] = new Object() ;
    laby[coordTab[i].line][coordTab[i].col].v = compteur++; //Poids de la cellule (utilisé pour l'ouverture des murs et la solution)
    laby[coordTab[i].line][coordTab[i].col].ligne = coordTab[i].line; // ligne (utile pour la solution)
    laby[coordTab[i].line][coordTab[i].col].colonne = coordTab[i].col; // colonne (utile pour la solution)
    laby[coordTab[i].line][coordTab[i].col].closed = [] // liste des cellules voisines avec mur
    laby[coordTab[i].line][coordTab[i].col].opened = [] // liste des cellules voisines sans mur
  }

  // remplissage des cellules voisines (pour l'instant ce sont des murs)
  for (var i=0; i<coordTab.length; i++) {
    if (coordTab[i].line>=1) laby[coordTab[i].line][coordTab[i].col].closed.push(laby[coordTab[i].line-1][coordTab[i].col]);
    if (coordTab[i].line<NB_LINE-1) laby[coordTab[i].line][coordTab[i].col].closed.push(laby[coordTab[i].line+1][coordTab[i].col]);
    if (coordTab[i].col>=1) laby[coordTab[i].line][coordTab[i].col].closed.push(laby[coordTab[i].line][coordTab[i].col-1]);
    if (coordTab[i].col<NB_COL-1) laby[coordTab[i].line][coordTab[i].col].closed.push(laby[coordTab[i].line][coordTab[i].col+1]);
  }

  // fonctions utiles pour l'ouverture des murs
  actualiserPoids = function(old_value, new_value) {
    for (var i=0; i<coordTab.length; i++) {
      if(laby[coordTab[i].line][coordTab[i].col].v == old_value){
        laby[coordTab[i].line][coordTab[i].col].v = new_value;
      }
    }
  }
  actualiserMurs = function(loc_source, loc_target){
    loc_source.opened.push(loc_target); //Ouverture mur source->target
    loc_target.opened.push(loc_source); //Ouverture mur target->source
    loc_source.closed = loc_source.closed.filter(function(x) {return x!=loc_target}); //On retire le mur fermé de la liste source->target
    loc_target.closed = loc_target.closed.filter(function(x) {return x!=loc_source}); //On retire le mur fermé de la liste target->source
  }

  var nb_ouvertures = 1;
  var target = [];
  var source = [];
  //Si génération aléatoire
  if(!loadMode){
    // on ouvre des murs aléatoirement :
    var nb_ouvertures = 1;
    while (nb_ouvertures<NB_LINE*NB_COL) {
      // on tire des coordonnées au hasard : i,j
      var i = randint(0,NB_LINE-1);
      var j = randint(0,NB_COL-1);
      source = laby[i][j];
      // on va essayer d'ouvrir à partir de la cellule source en i,j :
      var nb_murs = source.closed.length;
      if (nb_murs==0) continue; // si pas de mur, on abandonne, sinon:
      var direction = randint(0,3); // on choisit une direction au hasard parmi les 4 possibles
      if (direction>nb_murs-1) continue; // la direction n'était pas celle d'un mur (on abandonne alors)
      target = source.closed[direction] // cellule cible vers laquelle on ouvrira
      if (source.v==target.v) continue; // si l'ouverture du mur ne sert à rien, on abandonne
      actualiserMurs(source, target);
      actualiserPoids(source.v,target.v);
      nb_ouvertures++; // on a réussi à ouvrir un mur
    }
  //Si génération par lecture d'un JSON
  } else {
    for (var i=0; i<jsonLP.cells.length; i++) {
      source = laby[coordTab[i].line][coordTab[i].col];
      if(jsonLP.cells[i].right){
        target = laby[coordTab[i].line][coordTab[i].col+1];
        actualiserMurs(source, target);
        actualiserPoids(source.v,target.v);
      }
      if(jsonLP.cells[i].down){
        target = laby[coordTab[i].line+1][coordTab[i].col];
        actualiserMurs(source, target);
        actualiserPoids(source.v,target.v);
      }
    }
  }

  /*++++++++++++++++++++++++++++++++++++++++++++++++++++++*/
  /*                Fonction Affichage                    */
  /*++++++++++++++++++++++++++++++++++++++++++++++++++++++*/
  afficherMur = function(loc_line, loc_col){
    let rightCellWall = laby[loc_line][loc_col].closed.filter(function(x) {return x==laby[loc_line][Math.min(loc_col+1, NB_COL-1)]});
    let downCellWall = laby[loc_line][loc_col].closed.filter(function(x) {return x==laby[Math.min(loc_line+1, NB_LINE -1)][loc_col]});
    let checkRight = typeof rightCellWall[0] !== 'undefined';
    let checkDown = typeof downCellWall[0] !== 'undefined';
    context.beginPath();
    if (checkRight) {
      context.moveTo(COTE*Math.max(rightCellWall[0].colonne,loc_col),COTE*loc_line);
      context.lineTo(COTE*Math.max(rightCellWall[0].colonne,loc_col),COTE*(loc_line+1));
    }
    if (checkDown) {
      context.moveTo(COTE*loc_col,COTE*Math.max(downCellWall[0].ligne,loc_line));
      context.lineTo(COTE*(loc_col+1),COTE*Math.max(downCellWall[0].ligne,loc_line));
    }
    context.stroke();
  }
  
  afficherGrille = function(){
    context.beginPath();
    for (var i=0; i<coordTab.length; i++) {
      let line = coordTab[i].line;
      let col = coordTab[i].col;
      context.moveTo(line*COTE,col*COTE);
      context.lineTo(line*COTE+COTE,col*COTE);
      context.moveTo(line*COTE,col*COTE);
      context.lineTo(line*COTE,col*COTE+COTE);
    }
    context.stroke();
  }

  afficherContour = function(){
    context.beginPath();
    context.moveTo(0,0);
    context.lineTo(WIDTH,0);
    context.lineTo(WIDTH,HEIGHT-COTE);
    context.moveTo(WIDTH,HEIGHT);
    context.lineTo(0,HEIGHT);
    context.lineTo(0,0+30);
    context.stroke();
  }

  colorerCase = function(color, line, col){
    context.fillStyle = color;
    context.clearRect(col*COTE+1, line*COTE+1, COTE-2, COTE-2);
    context.fillRect(col*COTE+1, line*COTE+1, COTE-2, COTE-2);
  }

  afficherLaby = function(x) {
    let i = 0;
    var anim0 = setInterval(function(){
      afficherMur(coordTab[i].line, coordTab[i].col);
      afficherContour();
      i++;
      if(i==coordTab.length) clearInterval(anim0);
    }, x)
  }
  afficherContour();
  afficherLaby(10);
}

  /*++++++++++++++++++++++++++++++++++++++++++++++++++++++*/
  /*            Export                                    */
  /*++++++++++++++++++++++++++++++++++++++++++++++++++++++*/
  var listCells = new Array();
  var checkRight;
  var checkDown;

  var exportLaby = function(){
    for (var i=0; i<coordTab.length; i++) {
  /* On réinitiliase les valeurs */
      checkRight = false;
      checkDown = false;
      var line = coordTab[i].line;
      var col = coordTab[i].col;
  /* On vérifie si les murs du bas et droite sont ouverts */
      var rightCell = laby[line][col].opened.filter(function(x) {return x==laby[line][Math.min(col+1, NB_COL-1)]});
      var downCell = laby[line][col].opened.filter(function(x) {return x==laby[Math.min(line+1, NB_LINE -1)][col]});

      checkRight = typeof rightCell[0] !== 'undefined';
      checkDown = typeof downCell[0] !== 'undefined';

  /* On l'ajoute  à la liste */
      listCells.push({'down': checkDown, 'right': checkRight});
    }
  /* On transforme le tableau d'objet en json */
      var exportLabyJson = JSON.stringify({'cells': listCells , 'height': NB_LINE, 'width': NB_COL});
      jsonDiv.innerHTML = exportLabyJson;

      var data = new Blob([exportLabyJson], {type: 'application/json'});
      var textFile = window.URL.createObjectURL(data);

      var link = document.getElementById('downloadlink');
      link.href = textFile;
      link.download = "Maze"+NB_COL+"x"+NB_LINE+".json";
      exportDiv.style.display = 'block';
  }

  exportBtn.addEventListener('click', exportLaby, false);

/*++++++++++++++++++++++++++++++++++++++++++++++++++++++*/
/*            Solution du labyrinthe                    */
/*++++++++++++++++++++++++++++++++++++++++++++++++++++++*/

resolveLaby = function(){
  // on remet à 0 les valeurs v :
  if(coordTab == ""){
    return error.innerHTML = "Vous devez generer un labyrinthe avant de le resoudre ";
  }
  console.log(canvas);
  for (var i=0; i<coordTab.length; i++) {
    laby[coordTab[i].line][coordTab[i].col].v = 0;
  }
  laby[0][0].v = 1;
  queue = [ {l:0, c:0} ]

  var anim1 = setInterval(function(){
    // coordonnées de la case à tester :
    coords = queue.shift();
    source = laby[coords.l][coords.c];
    colorerCase('rgba(199,199,199,0.6)', source.ligne, source.colonne);
    var cpt = 0;
    for (var k=0; k<source.opened.length; k++) {
      target = source.opened[k];
      colorerCase('rgba(199,199,199,0.3)', target.ligne, target.colonne);
      if (target.v==0) {
        target.v = source.v+1;
        queue.push({l:target.ligne, c:target.colonne});
        colorerCase('rgba(255,255,255,0.5)', target.ligne, target.colonne);
      }
    }
    if(queue.length == 0) {
      clearInterval(anim1);
      var source = laby[NB_LINE-1][NB_COL-1];
      colorerCase('rgba(0,255,0,0.4)',NB_LINE-1,NB_COL-1); // source est l'étape courante du trajet solution
      var distance = source.v;
      source.v = 1;
      var anim2 = setInterval(function(){
        for (var k=0; k<source.opened.length; k++) {
          // on cherche à ce que target soit l'étape précédente du trajet solution
          target = source.opened[k];
          if (target.v==distance-1) {
            distance--;
            target.v = 1;
            source = target;
            colorerCase('rgba(0,255,0,0.4)', target.ligne, target.colonne);
            break;
          }
        }
        if(distance==1){
          colorerCase('rgba(0,255,0,0.4)', 0, 0);
          clearInterval(anim2);
        }
      }, 100);
    }
  }, 50);
}

/*++++++++++++++++++++++++++++++++++++++++++++++++++++++*/
/*            Lire Le fichier Json                      */
/*++++++++++++++++++++++++++++++++++++++++++++++++++++++*/

var openFile = function(event) {
  var filename = jsonFile.value.split(".");
  error.innerHTML = "";
  if(filename[filename.length-1] != "json"){
    return error.innerHTML ="Vous ne pouvez importer que des fichiers .json";
  }
  var input = event.target;
  var reader = new FileReader();
  reader.onload = function(){
    var text = reader.result;
    jsonInput.value = text;
  };
  reader.readAsText(input.files[0]);
};
//Résoudre le laby
resolveBtn.addEventListener('click', resolveLaby, false);
