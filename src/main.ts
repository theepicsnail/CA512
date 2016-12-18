import {Genes,GOL_Genes} from "./genes";
import {Display, Universe} from "./universe";
import {UniverseView} from "./universe_view";
import {ActionController} from "./actions";

let display = new Display();
display.width = 40;
display.height = 40;
display.scale = 4;

class Multiverse {
  private views: UniverseView[] = [];
  private actions: ActionController;
  constructor() {
    this.createTable();
    this.actions = new ActionController();
  }

  private createTable() {
    var table: HTMLTableElement =
        <HTMLTableElement>document.getElementById("multiverse");

    for (var r = 0; r < 3; r++) {
      var row = document.createElement("tr");
      table.appendChild(row);
      for (var c = 0; c < 3; c++) {
        let cell = document.createElement("td");
        row.appendChild(cell);

        let gene: Genes = GOL_Genes;// Genes.Random(Math.random());
        let universe: Universe = new Universe(display, gene).appendTo(cell);

        let view = new UniverseView(cell, universe);

        this.views.push(view);
        cell.onclick = function() { this.actions.select(view); }.bind(this);
      }
    }
  }

  public draw() { this.views.forEach((v) => v.u.draw()); }
}

var m = new Multiverse();
this.m = m;
var onFrame;
requestAnimationFrame(onFrame = function() {
  requestAnimationFrame(onFrame);
  m.draw();
});
