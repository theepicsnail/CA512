import {Genes} from "./genes";
import {State} from "./state";
import {UniverseView} from "./universe_view";

abstract class Action {
  abstract select(view: UniverseView);
  abstract getName(): String;
  abstract getHelp(): String;

  element: HTMLElement;
  getElement(): HTMLElement { return this.element; }
  constructor(html = "") {
    this.element =
        new DOMParser().parseFromString(html, "text/html").body.children[0];
  }
}

class BreedAction extends Action {
  public getName() { return "Breed"; }
  public getHelp() {
    return "Select 2 parents, then click where you want children to go.";
  }
  private first: UniverseView;
  private second: UniverseView;
  private element: HTMLElement;
  constructor() {
    super("<div><input type='button' value='reset'></div>");
    this.element.querySelector("input").onclick = this.reset.bind(this);
  }

  getElement() { return this.element; }
  select(view: UniverseView) {
    if (this.first == null) {
      this.first = view;
      view.select("#f00");
      return;
    }
    if (this.second == null) {
      this.second = view;
      view.select("#0F0");
      return;
    }

    view.u.setGenes(Genes.Mutate(
        Genes.Merge(this.first.u.getGenes(), this.second.u.getGenes())));
  }
  reset() {
    if (this.first != null)
      this.first.deselect();
    if (this.second != null)
      this.second.deselect();
    this.first = null;
    this.second = null;
  }
}

class Reseed extends Action {
  public getName() { return "Reseeding"; }
  public getHelp() {
    return "Select a universe to reseed (keeps the same genes)";
  }
  constructor() {
    super([
      "<select>", "<option>Single Point</option>", "<option>Random</option>",
      "</select>"
    ].join(''));
  }

  select(view: UniverseView) {
    var sel = this.getElement().selectedIndex;
    var u = view.u;

    for (var x = 0; x < u.width; x++)
      for (var y = 0; y < u.height; y++) {
        if (sel == 0 || Math.random() < .5)
          u.setCell(x, y, State.DEAD);
        else
          u.setCell(x, y, State.ALIVE);
      }
    if (sel == 0)
      u.setCell(u.width / 2 | 0, u.height / 2 | 0, State.ALIVE);
  }
}

class Mutate extends Action {
  public getName() { return "Mutate"; }
  public getHelp() { return "Click a universe to apply a mutation."; }
  select(view: UniverseView) {
    view.u.setGenes(Genes.Mutate(view.u.getGenes(), .05));
  }
}

class GeneView extends Action {
  public getName() { return "Genes IO"; }
  public getHelp() { return "Get or set the genes for a universe."; }
  selected: UniverseView;
  select(view: UniverseView) {
    this.selected = view;
    this.getElement().value = Genes.Serialize(this.selected.u.getGenes());
  }
  constructor() {
    super("<input>");
    this.getElement().onchange = this.change.bind(this);
  }
  change() {
    this.selected.u.setGenes(Genes.Deserialize(this.getElement().value));
  }
}

class RandomGenes extends Action {
  public getName() { return "Random Genes"; }
  public getHelp() { return "Select a universe to give new genes."; }
  select(view: UniverseView) { view.u.setGenes(Genes.Random(Math.random())); }
  constructor() { super(""); }
  change() {}
}

export class ActionController {
  private selectElement: HTMLSelectElement;
  private spanElement: HTMLSpanElement;
  private selectedAction: Action;
  constructor() {
    this.selectElement = <HTMLSelectElement>document.getElementById("actions");
    this.spanElement = <HTMLSpanElement>document.getElementById("help");
    this.actionDiv = <HTMLDivElement>document.getElementById("actionDiv");

    var none: Action = {
      select(u: any) {},
      getName : () => "None",
      getHelp : () => "Select an option to begin",
      getElement : () => undefined
    };

    this.addAction(none);
    this.addAction(new BreedAction());
    this.addAction(new Reseed());
    this.addAction(new Mutate());
    this.addAction(new GeneView());
    this.addAction(new RandomGenes());

    this.setSelectedAction(none);

    this.selectElement.onchange = function() {
      this.setSelectedAction(this.selectElement.selectedOptions[0].action);
    }.bind(this);
  }

  addAction(act: Action) {
    let a = act;
    let option = <HTMLOptionElement>document.createElement("option");
    option.text = act.getName().toString();
    option.action = act;
    this.selectElement.appendChild(option);
  }

  private setSelectedAction(act: Action) {
    this.spanElement.textContent = act.getHelp().toString();
    let n = act.getElement();

    this.actionDiv.innerHTML = "";
    if (n)
      this.actionDiv.appendChild(n);
    this.selectedAction = act;
  }

  select(view: UniverseView) {
    if (this.selectedAction)
      this.selectedAction.select(view);
  }
}
