// #region Graphics
// NOTE should probably add 'using pixijs for rendering to 
// the readme
const canvas = document.querySelector('canvas') ?? document.createElement('canvas');
const ctx = canvas.getContext('2d');

const pixijsParent = document.querySelector('#pixijs');
const graphics = new PIXI.Application({
    backgroundColor: 0x5E5E5E,
    resizeTo: pixijsParent
});
pixijsParent.appendChild(graphics.view);

addEventListener('resize', resize);
function resize() {
    let rect = canvas.parentElement.getBoundingClientRect();
    canvas.height = rect.height;
    canvas.width = rect.width;
}
// #endregion

//#region Utils
const hexMap = "0123456789abcdef";

function rand(min, max) {
    return (Math.random() * (max - min + 1)) + min;
}

class Vector {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    get magnitude() {
        return Math.sqrt(this.x ** 2 + this.y ** 2);
    }

    get direction() {
        return Math.atan2(this.y, this.x);
    }

    setMagnitude(m) {
        const d = this.direction;

        this.x = Math.cos(d) * m;
        this.y = Math.sin(d) * m;
        return this;
    }

    setDirection(d) {
        const m = this.magnitude;

        this.x = Math.cos(d) * m;
        this.y = Math.sin(d) * m;
        return this;
    }

    static get zero() {
        return new Vector(0, 0);
    }

    static get one() {
        return new Vector(1, 1);
    }

    static get rand() {
        return Vector.one.setDirection(rand(-Math.PI*2, Math.PI*2)).setMagnitude(1);
    }
}
//#endregion

//#region Input
class Input {
    static x = 0;
    static y = 0;

    static sensitivity = 40;
    static interval = 0;
    static count = 0;

    static down = []
    static pressed = []

    static gamepadTrackers = {}
    static gamepadCount = 0;
    static gamepads = {}

    static getKey(key) {
        if(this.down.includes(key))
            return true;

        return false;
    }

    static getKeyDown(key) {
        if(this.down.includes(key) && !this.pressed.includes(key))
            return true;

        return false;
    }

    static addGamepad(info) {
        const tracker = new GamepadTracker(info.index);
        Input.gamepadTrackers[info.index] = tracker;
        World.instantiate(tracker);
        this.gamepadCount++;
    }

    static removeGamepad(info) {
        Input.gamepadTrackers[info.index]?.destroy();
        Input.gamepadTrackers[info.index] = null;
        this.gamepadCount--;
    }

    static prep() {
        Input.gamepads = navigator.getGamepads();
    }

    static update() {
        this.pressed = [...Input.down]
        this.gamepads = navigator.getGamepads()
    }

    static draw() {
        
    }
}

addEventListener('keydown', e => {
    if(e.repeat || Input.down.includes(e.key))
        return;

    Input.down.push(e.key);
});

addEventListener('keyup', e => {
    if(!Input.down.indexOf(e.key) < 0)
        return;

    Input.down.splice(Input.down.indexOf(e.key), 1);
});

addEventListener('mousemove', e => {
    Input.x = e.clientX;
    Input.y = e.clientY;

    canvas.style.backgroundPositionX = (Input.x / canvas.width + canvas.width / 8) * Input.sensitivity + 'px';
    canvas.style.backgroundPositionY = (Input.y / canvas.height + canvas.height / 8) * Input.sensitivity + 'px';
});
addEventListener('contextmenu', e => {
    e.preventDefault();
});

addEventListener('gamepadconnected', e => {
    Input.addGamepad(e.gamepad);
});
addEventListener('gamepaddisconnected', e => {
    Input.removeGamepad(e.gamepad);
});
// #endregion

//#region Process
class Process {
    static processes = [];
    static add(callback, start, time) {
        const process = new Process(callback ?? null, start ?? null, time ?? null);
        this.processes.push(process);
        process.start();
    }

    static update() {
        for(let i = this.processes.length - 1; i >= 0; i--) {
            this.processes[i].tick();
            if(this.processes[i].time <= 0) 
                this.processes.splice(i, 1);
        }
    }

    constructor(callback, start, time) {
        this.callback = callback ?? ((t) => {});
        if(typeof(start) =='number') {
            this.time = start ?? 1000;
            this.start = ((t) => {});
            return;
        }

        this.time = time ?? 1000;
        this.start = start ?? ((t) => {});
    }

    tick() {
        this.time--;
        this.callback(this.time);
    }
}
// #endregion

//#region Menus
// TODO Also make Graph Menus (on a new branch)
class MenuItem {
    graphics = null;
    constructor() {
        this.color = 0xff0000;

        this.y = 100;
        this.x = 100;
    }

    start(parent) {
        if(this.graphics != null)
            this.graphics.destroy();

        this.graphics = new PIXI.Graphics();
        this.initialize();

        parent.graphics.addChild(this.graphics);
    }

    initialize() {
        this.graphics.beginFill(this.color);
        this.graphics.drawCircle(0, 0, 10);

        this.graphics.endFill();
    }

    render() {
        this.graphics.position.set(this.x, this.y);
    }

    position(x, y) {
        this.x = x ?? this.x;
        this.y = y ?? this.y;
        return this;
    }
}

//#region Menu Items
class MenuBlank extends MenuItem {
    constructor() {
        super();
    }

    initialize() {}

    start() {}

    render() {}
}

class MenuText extends MenuItem {
    constructor(content) {
        super();

        this.content = content ?? 'no text :(';
    }

    initialize() {
        const fontSize = 20;
        const text = new PIXI.Text(this.content, {
            fontFamily: 'Arial',
            fontWeight: 'bold',
            fontSize: fontSize,
            fill: 0x000000,
            align: 'left',
        });

        text.position.set(0, -fontSize / 2);
        this.graphics.addChild(text);
    }
}
//#endregion

//#region Selectables
class Selectable extends MenuItem {
    selected;
    selection;
    constructor() {
        super();
        this.color = 0x66cc00;
    }

    render() {
        if(this.selected && this.selection == null) {
            this.graphicselect();
        } else if(this.selection != null && !this.selected) {
            this.selection.destroy();
            this.selection = null;
        }
    
        this.graphics.position.set(this.x, this.y);
    }

    graphicselect() {
        const textWidth = this.text.getLocalBounds().width;
        const graphics = new PIXI.Graphics();

        const arrowHeight = 14;
        const arrowWidth = 5;
        const arrowY = -5;

        graphics.beginFill(0x000000, 1);
        graphics.moveTo(-15, arrowY);
        graphics.lineTo(-arrowWidth, arrowY + arrowHeight / 2);
        graphics.lineTo(-15, arrowY + arrowHeight);
        graphics.endFill();


        graphics.beginFill(0x000000, 1);
        graphics.moveTo(textWidth + 15, arrowY);
        graphics.lineTo(textWidth + arrowWidth, arrowY + arrowHeight / 2);
        graphics.lineTo(textWidth + 15, arrowY + arrowHeight);
        graphics.endFill();

        this.graphics.addChild(graphics);
        this.selection = graphics;
    }

    input() {

    }
    
    select() {
        this.selected = true;
    }

    deselect() {
        this.selected = false;
    }
}

class SelectableText extends Selectable {
    constructor(content) {
        super();

        this.content = content ?? "no selectable text :( :o=====8";
    }

    text;
    initialize() {
        const fontSize = 20;
        const text = new PIXI.Text(this.content, {
            fontFamily: 'Arial',
            fontWeight: 'bold',
            fontSize: fontSize,
            fill: 0x000000,
            align: 'left'
        });

        text.position.set(0, -fontSize / 2);
        this.graphics.addChild(text);
        this.text = text;
    }
}

class Button extends SelectableText {
    constructor(content, callback) {
        super();

        this.callback = callback ?? (() => {});
        this.content = content ?? "button with no text :o";
    }

    input() {
        if(Input.getKeyDown('Enter'))
            this.callback();
    }
}
//#endregion

// NOTE Not destroing the graphics objects of the menu items
// is basically a memory leak, so idfk. It might not be tho
// TODO add support for exit animations
// and immediate destruction options
class Menu {
    static menus = []; // NOTE this is the list of ACTIVE menus
    static add(menu) {
        Menu.menus.push(menu);
        menu.start();
    }

    static remove(menu) {
        const index = Menu.menus.indexOf(menu);
        menu.destroy();

        Menu.menus.splice(index, 1);
    }

    static update() {
        for(const menu of Menu.menus) {
            menu.render();
        }

        // NOTE only the most recently added 
        // menu receives input because of this
        // , which is bueno 👍
        Menu.menus.slice(-1)[0].input();
    }


    graphics;
    selected = 0;
    constructor(name, x, y, ...items) {
        this.x = x ?? 0;
        this.y = y ?? 0;

        this.name = name;
        this.items = items ?? [];
    }
    
    add(...items) {
        for(const item of items) {
            this.items.push(item);
        }
    }

    start() {        
        this.graphics = new PIXI.Graphics();
        
        let index = 0;
        this.selectables = [];
        for(const item of this.items) {
            const prototype = item.constructor.prototype;
            if(prototype instanceof Selectable || item.constructor === Selectable)
            this.selectables.push(item);
            
            this.setup(index, item);
            item.start(this);
            index++;
        }
        
        graphics.stage.addChild(this.graphics);
        this.select(0);
    }

    input() {
        if(Input.getKeyDown('ArrowDown')) {
            this.increment(1);
        }

        if(Input.getKeyDown('ArrowUp')) {
            this.increment(-1);
        }

        this.selectables[this.selected]?.input();
    }

    destroy() {
        this.graphics.destroy();
    }

    render() {
        this.tick();
        this.graphics.position.set(this.x, this.y);

        for(const item of this.items) {
            item.render();
        }
    } 

    select(index) {
        if(this.selectables.length < 1)
            return;

        this.selectables[this.selected]?.deselect();

        this.selected = Math.max(0, Math.min(this.selectables.length - 1, index));
        this.selectables[this.selected].select();
    }

    increment(amount) {
        this.select(this.selected + amount);
    }
    
    tick() {}

    setup(index, item) {}
}

//#region Menus
class ScrollingMenu extends Menu {
    constructor(name, x, y, smoothing, ...items) {
        super(name, x, y, ...items);
        this.smoothing = smoothing ?? 10;
        this.startY = y ?? 0;
    }

    tick() {
        const target = this.selectables[this.selected].y * -1;
        this.y = this.y + (target + this.startY - this.y) / this.smoothing;
    }

    setup(index, item) {
        item.y= index * 25;
    }
}
//#endregion

const sample = new ScrollingMenu('🥵🥵🥵', 100, 200, 12);
const submenu = new ScrollingMenu('🍆💦', 100, 200);

const s2b = new Button('button', () => {
    console.log("button pressed");
});
const s4o = new Button('next', () => {
    Menu.remove(sample);
    Menu.add(submenu);
});

const s8c = new Button('back', () => {
    Menu.remove(submenu);
    Menu.add(sample);
});

sample.add(new MenuText('UI Menu'), new MenuBlank(), s2b, new SelectableText('selectable text'), s4o);
submenu.add(new MenuText('Submenu'), new MenuBlank(), new SelectableText('it is what it is'), s8c);

Menu.add(sample);
//#endregion

class Entity {
    graphics = new PIXI.Graphics(); // NOTE this creates a new graphics object for every entity, which might be uneccessary
    toDestroy = false;
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    start() {
        this.graphics.beginFill(0xff0000);
        this.graphics.drawRect(10, 10, 20, 20);

        this.graphics.endFill();
        graphics.stage.addChild(this.graphics);
    }

    update() {

    }

    lateupdate() {

    }

    ondraw() {}
    updategraphics() {
        this.graphics.position.set(this.x, this.y);
    }
    draw() {
        if(this.toDestroy)
            return;

        this.updategraphics();
        this.ondraw();
    }
    


    ondestroy() {}
    destroy() {
        graphics.stage.removeChild(this.element);
        this.graphics.destroy();
        
        this.toDestroy = true;
        this.ondestroy();
    }
}

//#region Input Debugging
class MouseTracker extends Entity {
    constructor(x, y) {
        super(x ?? 0, y ?? 0);
    }

    start() {
        this.graphics.beginFill(0xff0000);
        this.graphics.drawCircle(0, 0, 5);
        graphics.stage.addChild(this.graphics);
    }

    update() {
        this.x = Input.x;
        this.y = Input.y;
    }

    ondraw() {
        ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.fillStyle = '#ff0000';
        ctx.strokeStyle = '#14238750';

        ctx.moveTo(Input.x, 0);
        ctx.lineTo(Input.x, canvas.height);

        ctx.moveTo(0, Input.y);
        ctx.lineTo(canvas.width, Input.y);

        ctx.arc(Input.x, Input.y, 3, 0, Math.PI*2);
        ctx.stroke();
        ctx.fill();
    }
}

class GamepadTracker extends Entity {
    constructor(index, x, y) {
        super(x ?? 0, y ?? 0);
        this.index = index;
    }

    ondraw() {
        throw new Error("Forgot to add support for pixijs drawing the gamepad lol.");
        const gamepad = navigator.getGamepads()[this.index];
        if(gamepad == null)
            return;

        // ctx.beginPath();
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#000000';

        const axes = Math.ceil(gamepad.axes.length/2);
        const w = canvas.width / Input.gamepadCount;
        const aw = Math.min(w, 300);
        const ah = 40;

        const x = (canvas.width / (Input.gamepadCount) * (this.index+1)) - (w);
        // ctx.rect(x + w/2 - aw/2, canvas.height / 2 - ah, aw, ah*2);
        // ctx.stroke();

        for(let i = 0; i < gamepad.axes.length; i += 2) {
            const r = aw / axes/2;
            const tr = Math.min(20, r);
            const axis = gamepad.axes[i];
            const cx = x + ((i/2) * r * 2) + r + (w/2 - aw/2);

            let ay = 0;
            if(i < gamepad.axes.length - 1)
                ay = gamepad.axes[i+1];

            ctx.beginPath();
            ctx.arc(cx, canvas.height / 2, tr, 0, Math.PI * 2);
            ctx.stroke();

            ctx.beginPath();
            ctx.arc(cx + (axis * tr), canvas.height / 2 + (ay*tr), 5, 0, Math.PI * 2);
            ctx.fillStyle = '#ff0000';
            ctx.fill();
        }

        const h = 20;
        const buttonCount = gamepad.buttons.length;
        for(const index in gamepad.buttons) {
            const button = gamepad.buttons[index];

            const r = aw / buttonCount/2;
            const tr = Math.min(7, r);
            const cx = x + ((index/2) * r * 4) + r + (w/2 - aw/2);

            ctx.beginPath();
            ctx.arc(cx, canvas.height / 2 - Math.min(20, aw / axes/2) - r - 15 + (Math.cos(2*Math.PI*(1/buttonCount)*index) * h + 40), tr, 0, Math.PI * 2);
            ctx.fillStyle = '#ff0000' + hexMap[Math.floor(button.value*(hexMap.length-1))].toString().repeat(2);
            ctx.stroke();
            ctx.fill();
        }
    }
}
//#endregion

//#region Game Entities
class Agent extends Entity {
    acceleration = Vector.zero;
    velocity = Vector.zero;

    angularAcceleration = 0;
    angularVelocity = 0;
    angle = -Math.PI/2;

    r = 50; // 50
    h = 10; // 10
    tr = 0;
    force = 0.4; // 0.1
    angularForce = 0.05; // 0.01
    tl = 0;

    friction = 0.9; // 0.985
    angularFriction = 0.94;
    gravity = 0.3;//0.3; //0.04;

    constructor(x, y) {
        super(x, y);
    }

    addForce(force) {
        this.acceleration.x += force.x;
        this.acceleration.y += force.y;
    }

    addAngularForce(force) {
        this.angularAcceleration += force;
    }

    start() {
        // this.graphics.beginFill(0xccff00);
        // this.graphics.endFill();
        
        const circles = new PIXI.Graphics();
        circles.beginFill(0xffcc00);
        circles.drawCircle(0, 0, 16);
        circles.drawCircle(this.r - 10, 0, 10);
        circles.drawCircle(-this.r + 10, 0, 10);
        circles.endFill();
        
        this.graphics.addChild(circles);
        graphics.stage.addChild(this.graphics);
    }

    update() {
        this.addForce(new Vector(0, this.gravity));

        const gamepad = Input.gamepads[0];

        this.tl = gamepad?.buttons[6].value ?? Input.getKey('ArrowLeft');
        this.tr = gamepad?.buttons[7].value ?? Input.getKey('ArrowRight');

        const force = (this.tl + this.tr) * this.force;
        this.addForce(Vector.one.setMagnitude(force).setDirection(this.angle));

        const r = this.r -10;
        if(this.tr > 0.09)
        {
            const p = new Particle(this.x + Math.cos(this.angle + Math.PI/2) * r, this.y + Math.sin(this.angle + Math.PI/2) * r);
            p.speed = 1;
            World.instantiate(p);
        }

        if(this.tl > 0.09)
        {
            const p = new Particle(this.x - Math.cos(this.angle + Math.PI/2) * r, this.y - Math.sin(this.angle + Math.PI/2) * r);
            p.speed = 1;
            World.instantiate(p);
        }

        this.addAngularForce(this.tl * this.angularForce);
        this.addAngularForce(-this.tr * this.angularForce);
    }

    lateupdate() {
        this.velocity.x += this.acceleration.x;
        this.velocity.y += this.acceleration.y;
        this.acceleration = Vector.zero;
        this.x += this.velocity.x;
        this.y += this.velocity.y;

        this.velocity.setMagnitude(Math.min(this.velocity.magnitude, 10));
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;

        this.angularVelocity += this.angularAcceleration;
        this.angle += this.angularVelocity;
        this.angularAcceleration = 0;
        
        this.angularVelocity = Math.min(Math.abs(this.angularVelocity), 0.015) * Math.sign(this.angularVelocity);
        this.angularVelocity *= this.angularFriction;


        if(this.x < 0) {
            this.x = canvas.width;
        }

        if(this.x > canvas.width) {
            this.x = 0;
        }

        if(this.y < 0) {
            this.y = canvas.height;
        }

        if(this.y > canvas.height) {
            this.y = 0;
        }
    }

    updategraphics() {
        this.graphics.position.set(this.x, this.y);
        this.graphics.rotation = this.angle + Math.PI/2;
    }
}

class Particle extends Entity {
    velocity = Vector.rand;
    increment = 1/25;
    speed = 2;
    life = 1;
    r = 10;

    constructor(x, y) {
        super(x ?? 0, y ?? 0);
    }

    start() {
        this.graphics.beginFill(0xff00cc);
        this.graphics.drawCircle(0, 0, this.r);

        this.graphics.endFill();

        this.graphics.blendMode = PIXI.BLEND_MODES.ADD;
        graphics.stage.addChild(this.graphics);
    }

    update() {
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        this.velocity.setMagnitude(this.speed * this.life);

        this.life -= this.increment;
        if(this.life > 0)
            return;

        this.destroy();
    }

    updategraphics() {
        this.graphics.position.set(this.x, this.y);
        this.graphics.scale.set(this.life);
    }
}
//#endregion

// NOTE processes and menus might get 
// messed up on scene changes
class World {
    static gamepads = {};
    static entities = [];
    static time;

    static start(setup = () => {}) {
        resize();
        setup();

        World.update();
    }

    static instantiate(entity) {
        this.entities.push(entity);
        entity.start();
    }

    static update() {
        World.time = requestAnimationFrame(World.update);
        Input.prep();

        Menu.update();

        World.entities.forEach(entity => entity.update());
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        World.entities.forEach(entity => entity.lateupdate());
        World.entities.forEach(entity => entity.draw());
        for(let i = World.entities.length - 1; i >= 0; i--) {
            if(!World.entities[i].toDestroy)
                continue;

            World.entities.splice(i, 1);
        }

        Process.update();
        Input.update();
        Input.draw();
    }
}

World.start(() => {
    World.instantiate(new Agent(canvas.width / 2, canvas.height / 2));
});
