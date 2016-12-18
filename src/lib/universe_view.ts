import {Universe} from "./universe";

export class UniverseView {
  public td: HTMLTableDataCellElement;
  public u: Universe;
  constructor(td: HTMLTableDataCellElement, u: Universe) {
    this.td = td;
    this.u = u;
  }
  select(color: string) { this.td.style.borderColor = color; }
  deselect() { this.td.style.borderColor = ""; }
}
