var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
System.register("state", [], function (exports_1, context_1) {
    "use strict";
    var __moduleName = context_1 && context_1.id;
    var State;
    return {
        setters: [],
        execute: function () {
            (function (State) {
                State[State["DEAD"] = 0] = "DEAD";
                State[State["ALIVE"] = 1] = "ALIVE";
            })(State || (State = {}));
            exports_1("State", State);
        }
    };
});
System.register("genes", ["state"], function (exports_2, context_2) {
    "use strict";
    var __moduleName = context_2 && context_2.id;
    var state_1, Genes, GOL_Genes;
    return {
        setters: [
            function (state_1_1) {
                state_1 = state_1_1;
            }
        ],
        execute: function () {
            Genes = (function () {
                function Genes() {
                    this.bits = new Uint32Array(16); // 512 bits
                }
                Genes.Serialize = function (g) { return g.bits.toString(); };
                Genes.Deserialize = function (s) {
                    var g = new Genes();
                    g.bits = Uint32Array.from(s.split(","));
                    return g;
                };
                Genes.ByExample = function (test) {
                    // Construct a set of genes by calling a test function with all combinations
                    // and saving the result.
                    var g = new Genes();
                    // Neighborhood of the dead
                    var neighborHood = [];
                    for (var i = 0; i < 9; i++) {
                        neighborHood.push(state_1.State.DEAD);
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
                            if (neighborHood[i] == state_1.State.DEAD) {
                                neighborHood[i] = state_1.State.ALIVE;
                                hasMore = true;
                            }
                            else {
                                neighborHood[i] = state_1.State.DEAD;
                            }
                        }
                    }
                    return g;
                };
                ;
                Genes.Random = function (alivePercent) {
                    if (alivePercent === void 0) { alivePercent = .5; }
                    var g = new Genes();
                    for (var i = 0; i < 512; i++) {
                        if (Math.random() < alivePercent)
                            g.setBit(i, state_1.State.ALIVE);
                        else
                            g.setBit(i, state_1.State.DEAD);
                    }
                    return g;
                };
                Genes.Merge = function (g1, g2, g2Percent) {
                    if (g2Percent === void 0) { g2Percent = .5; }
                    return Genes.ByExample(function (n) {
                        if (Math.random() > g2Percent)
                            return g1.transition(n);
                        else
                            return g2.transition(n);
                    });
                };
                Genes.Mutate = function (g, rate) {
                    if (rate === void 0) { rate = .01; }
                    return Genes.Merge(g, Genes.Random(), rate);
                };
                Genes.prototype.setBit = function (bitSelector, state) {
                    var bit = bitSelector % 32;
                    var byte = (bitSelector - bit) / 32;
                    // Set the bit to 1.
                    this.bits[byte] |= 1 << bit;
                    // Toggle it (to 0) if dead.
                    if (state == state_1.State.DEAD)
                        this.bits[byte] ^= 1 << bit;
                };
                Genes.prototype.transition = function (neighborhood) {
                    var bitSelector = 0;
                    neighborhood.forEach(function (value, index) {
                        if (value == state_1.State.ALIVE)
                            bitSelector += 1 << index;
                    });
                    var bit = bitSelector % 32;
                    var byte = (bitSelector - bit) / 32;
                    var value = this.bits[byte] >> bit & 1;
                    return value ? state_1.State.ALIVE : state_1.State.DEAD;
                };
                return Genes;
            }());
            exports_2("Genes", Genes);
            ;
            exports_2("GOL_Genes", GOL_Genes = Genes.ByExample(function (n) {
                var neighborsAlive = 0;
                var isAlive;
                n.forEach(function (v, idx) {
                    var a = v == state_1.State.ALIVE;
                    if (idx == 4)
                        isAlive = a;
                    else if (a)
                        neighborsAlive++;
                });
                if (isAlive)
                    if (neighborsAlive == 3 || neighborsAlive == 2)
                        return state_1.State.ALIVE;
                    else
                        return state_1.State.DEAD;
                else if (neighborsAlive == 3)
                    return state_1.State.ALIVE;
                else
                    return state_1.State.DEAD;
            }));
        }
    };
});
System.register("universe", ["state"], function (exports_3, context_3) {
    "use strict";
    var __moduleName = context_3 && context_3.id;
    var state_2, Display, Universe;
    return {
        setters: [
            function (state_2_1) {
                state_2 = state_2_1;
            }
        ],
        execute: function () {
            Display = (function () {
                function Display() {
                }
                return Display;
            }());
            exports_3("Display", Display);
            ;
            Universe = (function () {
                function Universe(displayProps, genes) {
                    this.highActivity = 0;
                    this.setGenes(genes);
                    this.width = displayProps.width;
                    this.height = displayProps.height;
                    // Setup dom element.
                    this.canvas = document.createElement("canvas");
                    this.ctx = this.canvas.getContext('2d');
                    this.canvas.width = displayProps.width;
                    this.canvas.height = displayProps.height;
                    this.canvas.style.width = displayProps.width * displayProps.scale + "px";
                    this.canvas.style.height = displayProps.height * displayProps.scale + "px";
                    // Setup the grids.
                    this.frontGrid = new Int8Array(displayProps.width * displayProps.height);
                    this.backGrid = new Int8Array(displayProps.width * displayProps.height);
                    // Setup update buffers.
                    this.dirty = new Set();
                    this.active = new Set();
                    // Setup cell colors
                    this.colors = new Map();
                    this.setColor(state_2.State.ALIVE, 0, 200, 0);
                    this.setColor(state_2.State.DEAD, 50, 0, 0);
                    // Initialize the grid to random, also set everything as needing drawn
                    this.reseed();
                }
                Universe.prototype.setGenes = function (genes) {
                    this.genes = genes;
                    return this;
                };
                Universe.prototype.getGenes = function () { return this.genes; };
                Universe.prototype.reseed = function () {
                    for (var i = 0; i < this.width * this.height; i++) {
                        this.setAt(i, Math.random() > .5 ? state_2.State.DEAD : state_2.State.ALIVE);
                        this.dirty.add(i);
                    }
                    return this;
                };
                Universe.prototype.setCell = function (x, y, val) {
                    var p = x + y * this.width;
                    this.setAt(p, val);
                    this.dirty.add(p);
                };
                Universe.prototype.setColor = function (state, r, g, b) {
                    var id = this.ctx.createImageData(1, 1);
                    id.data[0] = r;
                    id.data[1] = g;
                    id.data[2] = b;
                    id.data[3] = 255;
                    this.colors[state] = id;
                };
                Universe.prototype.setAt = function (pos, data) {
                    if (this.backGrid[pos] == data)
                        return;
                    this.backGrid[pos] = data;
                    this.dirty.add(pos);
                };
                Universe.prototype.getAt = function (pos) { return this.frontGrid[pos]; };
                Universe.prototype.getNeighborhood = function (pos) {
                    var out = new Array();
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
                };
                Universe.prototype.markActive = function (pos) {
                    var _this = this;
                    this.getNeighborhood(pos).forEach(function (v) { return _this.active.add(v); });
                };
                Universe.prototype.draw = function () {
                    var _this = this;
                    // Draw the screen
                    this.dirty.forEach(function (pos) {
                        _this.markActive(pos);
                        var x = pos % _this.width;
                        var y = (pos - x) / _this.width;
                        var v = _this.backGrid[pos];
                        _this.ctx.putImageData(_this.colors[v], x, y);
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
                    }
                    else {
                        this.highActivity = 0;
                    }
                    if (percent == 0) {
                        //this.genes = Genes.Mutate(this.genes);
                        this.reseed();
                    }
                };
                Universe.prototype.updateCell = function (pos) {
                    var isAlive = false;
                    var n = this.getNeighborhood(pos).map(this.getAt.bind(this));
                    this.setAt(pos, this.genes.transition(n));
                };
                Universe.prototype.appendTo = function (elem) {
                    elem.appendChild(this.canvas);
                    return this;
                };
                return Universe;
            }());
            exports_3("Universe", Universe);
            ;
        }
    };
});
System.register("universe_view", [], function (exports_4, context_4) {
    "use strict";
    var __moduleName = context_4 && context_4.id;
    var UniverseView;
    return {
        setters: [],
        execute: function () {
            UniverseView = (function () {
                function UniverseView(td, u) {
                    this.td = td;
                    this.u = u;
                }
                UniverseView.prototype.select = function (color) { this.td.style.borderColor = color; };
                UniverseView.prototype.deselect = function () { this.td.style.borderColor = ""; };
                return UniverseView;
            }());
            exports_4("UniverseView", UniverseView);
        }
    };
});
System.register("actions", ["genes", "state"], function (exports_5, context_5) {
    "use strict";
    var __moduleName = context_5 && context_5.id;
    var genes_1, state_3, Action, BreedAction, Reseed, Mutate, GeneView, RandomGenes, ActionController;
    return {
        setters: [
            function (genes_1_1) {
                genes_1 = genes_1_1;
            },
            function (state_3_1) {
                state_3 = state_3_1;
            }
        ],
        execute: function () {
            Action = (function () {
                function Action(html) {
                    if (html === void 0) { html = ""; }
                    this.element =
                        new DOMParser().parseFromString(html, "text/html").body.children[0];
                }
                Action.prototype.getElement = function () { return this.element; };
                return Action;
            }());
            BreedAction = (function (_super) {
                __extends(BreedAction, _super);
                function BreedAction() {
                    var _this = _super.call(this, "<div><input type='button' value='reset'></div>") || this;
                    _this.element.querySelector("input").onclick = _this.reset.bind(_this);
                    return _this;
                }
                BreedAction.prototype.getName = function () { return "Breed"; };
                BreedAction.prototype.getHelp = function () {
                    return "Select 2 parents, then click where you want children to go.";
                };
                BreedAction.prototype.getElement = function () { return this.element; };
                BreedAction.prototype.select = function (view) {
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
                    view.u.setGenes(genes_1.Genes.Mutate(genes_1.Genes.Merge(this.first.u.getGenes(), this.second.u.getGenes())));
                };
                BreedAction.prototype.reset = function () {
                    if (this.first != null)
                        this.first.deselect();
                    if (this.second != null)
                        this.second.deselect();
                    this.first = null;
                    this.second = null;
                };
                return BreedAction;
            }(Action));
            Reseed = (function (_super) {
                __extends(Reseed, _super);
                function Reseed() {
                    return _super.call(this, [
                        "<select>", "<option>Single Point</option>", "<option>Random</option>",
                        "</select>"
                    ].join('')) || this;
                }
                Reseed.prototype.getName = function () { return "Reseeding"; };
                Reseed.prototype.getHelp = function () {
                    return "Select a universe to reseed (keeps the same genes)";
                };
                Reseed.prototype.select = function (view) {
                    var sel = this.getElement().selectedIndex;
                    var u = view.u;
                    for (var x = 0; x < u.width; x++)
                        for (var y = 0; y < u.height; y++) {
                            if (sel == 0 || Math.random() < .5)
                                u.setCell(x, y, state_3.State.DEAD);
                            else
                                u.setCell(x, y, state_3.State.ALIVE);
                        }
                    if (sel == 0)
                        u.setCell(u.width / 2 | 0, u.height / 2 | 0, state_3.State.ALIVE);
                };
                return Reseed;
            }(Action));
            Mutate = (function (_super) {
                __extends(Mutate, _super);
                function Mutate() {
                    return _super.apply(this, arguments) || this;
                }
                Mutate.prototype.getName = function () { return "Mutate"; };
                Mutate.prototype.getHelp = function () { return "Click a universe to apply a mutation."; };
                Mutate.prototype.select = function (view) {
                    view.u.setGenes(genes_1.Genes.Mutate(view.u.getGenes(), .05));
                };
                return Mutate;
            }(Action));
            GeneView = (function (_super) {
                __extends(GeneView, _super);
                function GeneView() {
                    var _this = _super.call(this, "<input>") || this;
                    _this.getElement().onchange = _this.change.bind(_this);
                    return _this;
                }
                GeneView.prototype.getName = function () { return "Genes IO"; };
                GeneView.prototype.getHelp = function () { return "Get or set the genes for a universe."; };
                GeneView.prototype.select = function (view) {
                    this.selected = view;
                    this.getElement().value = genes_1.Genes.Serialize(this.selected.u.getGenes());
                };
                GeneView.prototype.change = function () {
                    this.selected.u.setGenes(genes_1.Genes.Deserialize(this.getElement().value));
                };
                return GeneView;
            }(Action));
            RandomGenes = (function (_super) {
                __extends(RandomGenes, _super);
                function RandomGenes() {
                    return _super.call(this, "") || this;
                }
                RandomGenes.prototype.getName = function () { return "Random Genes"; };
                RandomGenes.prototype.getHelp = function () { return "Select a universe to give new genes."; };
                RandomGenes.prototype.select = function (view) { view.u.setGenes(genes_1.Genes.Random(Math.random())); };
                RandomGenes.prototype.change = function () { };
                return RandomGenes;
            }(Action));
            ActionController = (function () {
                function ActionController() {
                    this.selectElement = document.getElementById("actions");
                    this.spanElement = document.getElementById("help");
                    this.actionDiv = document.getElementById("actionDiv");
                    var none = {
                        select: function (u) { },
                        getName: function () { return "None"; },
                        getHelp: function () { return "Select an option to begin"; },
                        getElement: function () { return undefined; }
                    };
                    this.addAction(none);
                    this.addAction(new BreedAction());
                    this.addAction(new Reseed());
                    this.addAction(new Mutate());
                    this.addAction(new GeneView());
                    this.addAction(new RandomGenes());
                    this.setSelectedAction(none);
                    this.selectElement.onchange = function () {
                        this.setSelectedAction(this.selectElement.selectedOptions[0].action);
                    }.bind(this);
                }
                ActionController.prototype.addAction = function (act) {
                    var a = act;
                    var option = document.createElement("option");
                    option.text = act.getName().toString();
                    option.action = act;
                    this.selectElement.appendChild(option);
                };
                ActionController.prototype.setSelectedAction = function (act) {
                    this.spanElement.textContent = act.getHelp().toString();
                    var n = act.getElement();
                    this.actionDiv.innerHTML = "";
                    if (n)
                        this.actionDiv.appendChild(n);
                    this.selectedAction = act;
                };
                ActionController.prototype.select = function (view) {
                    if (this.selectedAction)
                        this.selectedAction.select(view);
                };
                return ActionController;
            }());
            exports_5("ActionController", ActionController);
        }
    };
});
System.register("main", ["genes", "universe", "universe_view", "actions"], function (exports_6, context_6) {
    "use strict";
    var __moduleName = context_6 && context_6.id;
    var genes_2, universe_1, universe_view_1, actions_1, display, Multiverse, m, onFrame;
    return {
        setters: [
            function (genes_2_1) {
                genes_2 = genes_2_1;
            },
            function (universe_1_1) {
                universe_1 = universe_1_1;
            },
            function (universe_view_1_1) {
                universe_view_1 = universe_view_1_1;
            },
            function (actions_1_1) {
                actions_1 = actions_1_1;
            }
        ],
        execute: function () {
            display = new universe_1.Display();
            display.width = 40;
            display.height = 40;
            display.scale = 4;
            Multiverse = (function () {
                function Multiverse() {
                    this.views = [];
                    this.createTable();
                    this.actions = new actions_1.ActionController();
                }
                Multiverse.prototype.createTable = function () {
                    var table = document.getElementById("multiverse");
                    for (var r = 0; r < 3; r++) {
                        var row = document.createElement("tr");
                        table.appendChild(row);
                        var _loop_1 = function () {
                            var cell = document.createElement("td");
                            row.appendChild(cell);
                            var gene = genes_2.GOL_Genes; // Genes.Random(Math.random());
                            var universe = new universe_1.Universe(display, gene).appendTo(cell);
                            var view = new universe_view_1.UniverseView(cell, universe);
                            this_1.views.push(view);
                            cell.onclick = function () { this.actions.select(view); }.bind(this_1);
                        };
                        var this_1 = this;
                        for (var c = 0; c < 3; c++) {
                            _loop_1();
                        }
                    }
                };
                Multiverse.prototype.draw = function () { this.views.forEach(function (v) { return v.u.draw(); }); };
                return Multiverse;
            }());
            m = new Multiverse();
            this.m = m;
            requestAnimationFrame(onFrame = function () {
                requestAnimationFrame(onFrame);
                m.draw();
            });
        }
    };
});
