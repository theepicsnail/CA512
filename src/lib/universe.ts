import {Genes} from "./genes";
import {State} from "./state";

export class Display {
  width: number;
  height: number;
  scale: number;
};

export class Universe {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private frontGrid: Int8Array;
  private backGrid: Int8Array;

  private dirty: Set<number>;
  private active: Set<number>;

  private colors: Map<State, ImageData>;

  private width: number;
  private height: number;
  private genes: Genes;
  constructor(displayProps: Display, genes: Genes) {
    this.setGenes(genes);
    this.width = displayProps.width;
    this.height = displayProps.height;

    // Setup dom element.
    this.canvas = <HTMLCanvasElement>document.createElement("canvas");
    this.ctx = this.canvas.getContext('2d');
    this.canvas.width = displayProps.width;
    this.canvas.height = displayProps.height;
    this.canvas.style.width = displayProps.width * displayProps.scale + "px";
    this.canvas.style.height = displayProps.height * displayProps.scale + "px";

    // Setup the grids.
    this.frontGrid = new Int8Array(displayProps.width * displayProps.height);
    this.backGrid = new Int8Array(displayProps.width * displayProps.height);

    // Setup update buffers.
    this.dirty = new Set<number>();
    this.active = new Set<number>();

    // Setup cell colors
    this.colors = new Map<State, ImageData>();
    this.setColor(State.ALIVE, 0, 200, 0);
    this.setColor(State.DEAD, 50, 0, 0);

    // Initialize the grid to random, also set everything as needing drawn
    this.reseed();
  }

  public setGenes(genes: Genes): Universe {
    this.genes = genes;
    return this;
  }
  public getGenes(): Genes { return this.genes; }
  public reseed(): Universe {
    for (var i = 0; i < this.width * this.height; i++) {
      this.setAt(i, Math.random() > .5 ? State.DEAD : State.ALIVE);
      this.dirty.add(i);
    }
    return this;
  }
  public setCell(x: number, y: number, val: State) {
    let p = x + y * this.width;
    this.setAt(p, val);
    this.dirty.add(p);
  }

  private setColor(state: State, r: number, g: number, b: number) {
    var id = this.ctx.createImageData(1, 1);
    id.data[0] = r;
    id.data[1] = g;
    id.data[2] = b;
    id.data[3] = 255;
    this.colors[state] = id;
  }

  private setAt(pos: number, data: State) {
    if (this.backGrid[pos] == data)
      return;
    this.backGrid[pos] = data;
    this.dirty.add(pos);
  }

  private getAt(pos: number): State { return this.frontGrid[pos]; }

  private getNeighborhood(pos: number): Array<number> {
    var out = new Array<number>();
    // This can probably be done smarter.
    // Marking a point as active adds the point + its neighbors to the active
    // set. (since activity here can impact neighbors).
    var x = pos % this.width;
    var y = (pos - x) / this.width;
    for (var dx = -1; dx <= 1; dx++)
      for (var dy = -1; dy <= 1; dy++) {
        var nx = (x + dx + this.width) % this.width;
        var ny = (y + dy + this.height) % this.height;
        out.push(nx + ny * this.width);
      }
    return out;
  }

  private markActive(pos: number) {
    this.getNeighborhood(pos).forEach((v) => this.active.add(v));
  }

  public draw() {
    // Draw the screen
    this.dirty.forEach((pos: number) => {
      this.markActive(pos);
      var x = pos % this.width;
      var y = (pos - x) / this.width;
      var v = this.backGrid[pos];

      this.ctx.putImageData(this.colors[v], x, y);
    });
    this.dirty.clear();

    // Flip the the buffers.
    var tmp = this.backGrid;
    this.backGrid = this.frontGrid;
    this.frontGrid = tmp;

    // Update the back one.
    this.active.forEach(this.updateCell.bind(this));
    this.active.clear();


    // Logic for killing universes that go stale (or remain too highly active.)
    var percent = this.dirty.size / (this.width * this.height);
    if (percent > .25) {
      this.highActivity++;
      if (this.highActivity >= 200) {

          percent = 0; // kill it.
          
          this.highActivity = 0;
      }
    } else {
      this.highActivity = 0;
    }
    if (percent == 0) {
      //this.genes = Genes.Mutate(this.genes);
      this.reseed();
    }
  }
  highActivity = 0;


  updateCell(pos: number) {
    var isAlive = false;
    var n = this.getNeighborhood(pos).map<State>(this.getAt.bind(this));
    this.setAt(pos, this.genes.transition(n));
  }

  public appendTo(elem: HTMLElement): Universe {
    elem.appendChild(this.canvas);
    return this;
  }
};
