LPDW PROJECT: CrazyMaze
=======================

###Technical choices
- Back-end: javascript
- Front-end: html5 canvas
- Generation: Kruskal
- Resolution: A*

###Generation
We chose a classical algorithm called Kruskal algorithm.
First, it generates all the walls. At this point, each cell is totally closed,
and has a unique weight. Then, the alogorithm randomly open walls, joinning cell's weight.
It stops when all cells have the same weight.
We chose this one because it is pretty easy to implement,
and fits nicely with both the Json format chosen by the class and the resolution algorithm we chose.
Moreover, it has the advantage of generating a perfect maze with an unique solution, which is nice !?

###Resolution
For the resolution algorithm, we chose another classic: A*
This algorithm is known for his rapidity and his simplicity.
It is massively used for IA and  graph search.
So we used Kruskal cell's weight system to make our maze become a graph.
Starting from cell 0x0 with weight 0, to the end with max weight,
the algorithm loops throught each cell, updating their weight by calculating the distance from start and to the end.
One by one, the algorithm links cells to the end, and when it finaly comes to the end,
it just has to go back following the links !
We chose this resolution algorithm because it won his spurs by years,
and it fits well with Kruskal system.

###Comments
We had troubles with nested loops implementing the chosen algorithms.
We finaly made a look-up table as a maze cartography, to avoid nested loops hell !

###Description
Things you can do:
- Generate a maze chosing its size
- Press resolve button to see the resolution animation
- Export the maze as json text or json file
- Import a maze in json text or json file

Things you can't do:
- Chose a size over 130x130 (avoid memory problem with browser..)
- What you want (life..)

####Enjoy !
