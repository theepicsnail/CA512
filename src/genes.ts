import {State} from "./state";

type TransitionFunction = (neighborhood: State[]) => State;

export class Genes {
  static Serialize(g: Genes): String { return g.bits.toString(); }
  static Deserialize(s: String): Genes {
    let g = new Genes();
    g.bits = Uint32Array.from(s.split(","));
    return g;
  }

  static ByExample(test: TransitionFunction): Genes {
    // Construct a set of genes by calling a test function with all combinations
    // and saving the result.
    var g = new Genes();

    // Neighborhood of the dead
    var neighborHood: State[] = [];
    for (var i = 0; i < 9; i++) {
      neighborHood.push(State.DEAD);
    }

    // Walk through each combination
    var bit = 0;
    var hasMore = true;
    while (hasMore) {
      g.setBit(bit, test(neighborHood));

      // Increment a counter and go to the next state.
      // There really should be a utility for this.
      bit++;
      hasMore = false;
      for (var i = 0; i < 9 && !hasMore; i++) {
        if (neighborHood[i] == State.DEAD) {
          neighborHood[i] = State.ALIVE;
          hasMore = true;
        } else {
          neighborHood[i] = State.DEAD;
        }
      }
    }
    return g;
  };

  static Random(alivePercent: number = .5): Genes {
    var g = new Genes();
    for (var i = 0; i < 512; i++) {
      if (Math.random() < alivePercent)
        g.setBit(i, State.ALIVE);
      else
        g.setBit(i, State.DEAD);
    }
    return g;
  }

  static Merge(g1: Genes, g2: Genes, g2Percent: number = .5): Genes {
    return Genes.ByExample((n: State[]): State => {
      if (Math.random() > g2Percent)
        return g1.transition(n);
      else
        return g2.transition(n);
    });
  }

  static Mutate(g: Genes, rate: number = .01): Genes {
    return Genes.Merge(g, Genes.Random(), rate);
  }

  // The actual gene!
  private bits: Uint32Array;

  constructor() {
    this.bits = new Uint32Array(16); // 512 bits
  }

  private setBit(bitSelector: number, state: State) {
    var bit = bitSelector % 32;
    var byte = (bitSelector - bit) / 32;

    // Set the bit to 1.
    this.bits[byte] |= 1 << bit;

    // Toggle it (to 0) if dead.
    if (state == State.DEAD)
      this.bits[byte] ^= 1 << bit;
  }
  public transition(neighborhood: State[]): State {
    var bitSelector = 0;
    neighborhood.forEach((value: State, index: number) => {
      if (value == State.ALIVE)
        bitSelector += 1 << index;
    });

    var bit = bitSelector % 32;
    var byte = (bitSelector - bit) / 32;

    var value = this.bits[byte] >> bit & 1
    return value ? State.ALIVE : State.DEAD;
  }
};

export var GOL_Genes: Genes = Genes.ByExample(function(n: State[]): State {
  var neighborsAlive = 0;
  var isAlive;
  n.forEach((v: State, idx: number) => {
    var a = v == State.ALIVE;
    if (idx == 4)
      isAlive = a;
    else if (a)
      neighborsAlive++;
  });
  if (isAlive)
    if (neighborsAlive == 3 || neighborsAlive == 2)
      return State.ALIVE;
    else
      return State.DEAD;
  else if (neighborsAlive == 3)
    return State.ALIVE;
  else
    return State.DEAD;
});
