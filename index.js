canvas = document.getElementById("labyrinthe");
context = canvas.getContext('2d');
var generateBtn = document.getElementById('submitGen');
var loadBtn = document.getElementById('submitJson');
var exportBtn = document.getElementById('export');
var resolveBtn = document.getElementById('resolve');
var genrateForm = document.getElementById('formGen');
var loadForm = document.getElementById('formLoad');
var jsonInput =  document.getElementById('inputJson');

var NB_COL = 0;
var NB_LINE = 0;
var COTE = 30;
var jsonL = ""; //JsonLoaded
var jsonLP = ""; //JsonLoadedParsed
var coordTab = []; //Look Up Table for coordinates
var laby = [];
var loadMode = false;

//Génrer un laby aléatoirement de taille choisie
generateBtn.addEventListener('click', function(){
  coordTab = [];
  laby = [];
  NB_COL = document.getElementById('nbrCol').value;
  NB_LINE = document.getElementById('nbrLine').value;
  for(i=0; i<NB_LINE*NB_COL; i++){
    coordTab[i] = {'line': Math.trunc(i/NB_COL) ,'col': i - (NB_COL * Math.trunc(i/NB_COL))};
  }
  loadMode = false;
  labyFunc();
}, false);

//Générer un laby avec un json
loadBtn.addEventListener('click', function(){
  jsonL = jsonInput.value;
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
  // afficherMur = function(){
  //
  // }
  //
  afficherLaby = function() {
    for (var i=0; i<coordTab.length; i++) {
      let line = coordTab[i].line;
      let col = coordTab[i].col;
      var source = laby[line][coordTab[i].col];
      if (source.v==1) {
        context.fillStyle = 'rgb(0,255,0)';
        context.fillRect(coordTab[i].col*COTE, coordTab[i].line*COTE, COTE, COTE);
      }

      // affichage des murs :
      for (var k=0; k<source.closed.length; k++) {
        t = source.closed[k]; // t pour target
        context.beginPath();
        if (t.ligne==coordTab[i].line) {
          context.moveTo(COTE*Math.max(t.colonne,coordTab[i].col),COTE*coordTab[i].line);
          context.lineTo(COTE*Math.max(t.colonne,coordTab[i].col),COTE*(coordTab[i].line+1));
        } else if (t.colonne==coordTab[i].col) {
          context.moveTo(COTE*coordTab[i].col,COTE*Math.max(t.ligne,coordTab[i].line));
          context.lineTo(COTE*(coordTab[i].col+1),COTE*Math.max(t.ligne,coordTab[i].line));
        }
        context.stroke();
      }

      //var rightCellWall = laby[line][col].opened.filter(function(x) {return x==laby[line][Math.min(col+1, NB_COL-1)]});
      //var downCellWall = laby[line][col].opened.filter(function(x) {return x==laby[Math.min(line+1, NB_LINE -1)][col]});

    }

    // affichage du contour du labyrinthe :
    context.beginPath();
    context.moveTo(0,0);
    context.lineTo(WIDTH,0);
    context.lineTo(WIDTH,HEIGHT-COTE);
    context.moveTo(WIDTH,HEIGHT);
    context.lineTo(0,HEIGHT);
    context.lineTo(0,0+30);
    context.stroke();
  }
  afficherLaby();
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
      let line = coordTab[i].line;
      let col = coordTab[i].col;
  /* On vérifie si les murs du bas et droite sont ouverts */
      var rightCell = laby[line][col].opened.filter(function(x) {return x==laby[line][Math.min(col+1, NB_COL-1)]});
      var downCell = laby[line][col].opened.filter(function(x) {return x==laby[Math.min(line+1, NB_LINE -1)][col]});
      checkRight = typeof rightCell[0] !== 'undefined';
      checkDown = typeof downCell[0] !== 'undefined';
  /* On l'ajoute  à la liste */
      listCells.push({'down': checkDown, 'right': checkRight});
    }
  /* On transforme le tableau d'objet en json */
      var exportLabyJson =  {'cells': listCells , 'height': NB_LINE, 'width': NB_COL};
      var myJsonString = JSON.stringify(exportLabyJson);
      console.log(myJsonString);
  }

  exportBtn.addEventListener('click', exportLaby, false);

/*++++++++++++++++++++++++++++++++++++++++++++++++++++++*/
/*            Solution du labyrinthe                    */
/*++++++++++++++++++++++++++++++++++++++++++++++++++++++*/

resolveLaby = function(){
  // on remet à 0 les valeurs v :
  for (var i=0; i<coordTab.length; i++) {
    laby[coordTab[i].line][coordTab[i].col].v = 0;
  }
  laby[0][0].v = 1;
  queue = [ {l:0, c:0} ]

  var anim1 = setInterval(function(){
    // coordonnées de la case à tester :
    coords = queue.shift();
    source = laby[coords.l][coords.c];
    var cpt = 0;
    for (var k=0; k<source.opened.length; k++) {
      target = source.opened[k];
      if (target.v==0) {
        target.v = source.v+1;
        queue.push({l:target.ligne, c:target.colonne});
        context.fillStyle = 'rgb(255,255,0)';
        context.fillRect(target.colonne*COTE-2, target.ligne*COTE-2, COTE-2, COTE-2);
      }
    }
    console.log(queue);
    console.log(queue.length);
    if(queue.length == 0) {
      console.log('HELLO');
      clearInterval(anim1);
      var source = laby[NB_LINE-1][NB_COL-1]; // source est l'étape courante du trajet solution
      var distance = source.v;
      source.v = 1;
      var anim2 = setInterval(function(){
        console.log('titi');
        for (var k=0; k<source.opened.length; k++) {
          // on cherche à ce que target soit l'étape précédente du trajet solution
          target = source.opened[k];
          if (target.v==distance-1) {
            distance--;
            target.v = 1;
            source = target;
            context.fillStyle = 'rgb(0,255,0)';
            context.fillRect(target.colonne*COTE, target.ligne*COTE, COTE, COTE);
            break;
          }
        }
        if(distance==1) clearInterval(anim2);
      }, 100);
    }
  }, 50);
}

//Résoudre le laby
resolveBtn.addEventListener('click', resolveLaby, false);
