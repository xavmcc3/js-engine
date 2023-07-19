// #region Graphics
const pixijsParent = document.querySelector('#pixijs');
const graphics = new PIXI.Application({
    backgroundColor: 0x5E5E5E,
    resizeTo: pixijsParent
});

pixijsParent.appendChild(graphics.view);
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

//#region Time
class Time {
    static last = Date.now();
    static startTime = 0;
    static frames = 0;
    static delta = 0;

    static frameRate = 60;

    static start() {
        Time.startTime = Date.now();
    }

    static getDelta() {
        const delta = (Date.now() - Time.last) / Time.targetTime;
        Time.last = Date.now();
        
        Time.delta = delta;
        Time.time = Date.now() - Time.startTime;
        return delta;
    }

    static get targetTime() {
        return 1000 / Time.frameRate;
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

    // canvas.style.backgroundPositionX = (Input.x / canvas.width + canvas.width / 8) * Input.sensitivity + 'px';
    // canvas.style.backgroundPositionY = (Input.y / canvas.height + canvas.height / 8) * Input.sensitivity + 'px';
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
class MenuItem {
    selected = false;
    children = [];
    element;

    append(root) {
        const r = root ?? document.body;
        r.appendChild(this.element);
        return this.element;
    }

    setAttribute(key, value) {
        this.element.setAttribute(key, value);
    }

    getAttribute(key) {
        return this.element.getAttribute(key);
    }

    setStyle(key, value) {
        this.element.style[key] = value;
    }

    getStyle(key) {
        return getComputedStyle(this.element)[key];
    }

    add(menuitem) {
        this.children.push(menuitem);
        this.element.appendChild(menuitem.element);
        return menuitem;
    }
}


class Menu extends MenuItem {
    selected = null;
    element = (() => {
        const element = document.createElement('div');
        return element;
    })();

    static create(root) {
        const menu = new Menu();
        menu.append(root);
        return menu;
    }

    select(element) {
        if(!this.children.includes(element))
            return;

        if(this.selected != null)
            this.selected?.deselect();

        element.select();
        this.selected = element;
        return element;
    }

    deselect() {
        throw new Error('fuck balls');
    }
}


class MenuGroup extends MenuItem {
    element = (() => {
        const element = document.createElement('fieldset');
        return element;
    })();
}

class MenuText extends MenuItem {
    element = (() => {
        const element = document.createElement('p');
        return element;
    })();

    constructor(text) {
        super();
        this.element.innerText = text ?? "";
    }
}

class MenuHeader extends MenuItem {
    element = (() => {
        const element = document.createElement('h2');
        return element;
    })();

    constructor(text) {
        super();
        this.element.innerText = text ?? "";
    }
}


class Selectable extends MenuItem {
    select() {
        this.selected = true;
        this.element.classList.add('selected');
    }

    deselect() {
        this.selected = false;
        this.element.classList.remove('selected');
    }
}


class MenuButton extends Selectable {
    element = (() => {
        const element = document.createElement('button');
        element.addEventListener('click', e => {
            this.onclick(e);
        });
        return element;
    })();

    constructor(text, callback) {
        super();
        this.element.innerText = text ?? "";
        this.callback = callback ?? (() => {});
    }

    setCallback(callback) {
        this.callback = callback ?? (() => {});
    }

    onclick(e) {
        this.callback(e);
    }
}

class MenuToggle extends Selectable {
    value = true;
    element = (() => {
        const label = document.createElement('label');
        label.classList.add('checkbox');

        const checkbox = document.createElement('input');
        checkbox.setAttribute('type', 'checkbox');
        checkbox.addEventListener('input', e => {
            this.oninput(e.target.checked);
        });

        const span = document.createElement('span');
        const text = document.createElement('p');

        label.appendChild(checkbox);
        label.appendChild(span);
        label.appendChild(text);
        return label;
    })();

    constructor(text, callback) {
        super();
        this.element.querySelector('p').innerText = text ?? "";
        this.callback = callback ?? (() => {});
    }

    setCallback(callback) {
        this.callback = callback ?? (() => {});
    }

    oninput(value) {
        this.value = value;
        this.callback(value);
    }

    set(on) {
        this.value = on;
        this.element.querySelector('input').checked = on;
        return this.value;
    }

    toggle() {
        this.set(!this.value);
        return this.value;
    }
}

class MenuRadio extends Selectable {
    value = true;
    element = (() => {
        const label = document.createElement('label');
        label.classList.add('radio');

        const radio = document.createElement('input');
        radio.setAttribute('type', 'radio');
        radio.addEventListener('input', e => {
            this.oninput(e.target.checked);
        });

        const span = document.createElement('span');
        const text = document.createElement('p');

        label.appendChild(radio);
        label.appendChild(span);
        label.appendChild(text);
        return label;
    })();

    constructor(text, name, callback) {
        super();
        this.element.querySelector('p').innerText = text ?? "";
        this.element.querySelector('input').name = name ?? "";
        this.callback = callback ?? (() => {});
    }
}

class MenuDropdown extends Selectable {
    value;
    element = (() => {
        const label = document.createElement('label');
        label.classList.add('dropdown');

        const text = document.createElement('span');
        text.classList.add('text');

        const span = document.createElement('span');
        span.classList.add('dropdown');

        const select = document.createElement('select');
        select.onchange = e => {
            this.onchange(e);
        }


        label.appendChild(text);
        label.appendChild(span);
        label.appendChild(select);
        return label;
    })();

    constructor(text, items, callback) {
        super();
        this.element.querySelector('.text').innerText = (text ?? "") + " ";
        for(const item of items) {
            this.addItem(item);
        }

        this.value = this.element.querySelector('select').value;
        this.callback = callback ?? (() => {});
    }

    onchange(e) {
        this.value = e.target.value;
        this.callback(e.target.value);
    }

    addItem(item) {
        const root = this.root ?? this.element.querySelector('select');
        const option = document.createElement('option');
        option.innerText = item;
        root.appendChild(option);
        this.root = root;
    }

    removeItem(item) {
        const root = this.root ?? this.element.querySelector('select');
        for(let i = root.childElementCount - 1; i >= 0; i--) {
            const option = root.childNodes[i];
            if(option.innerText == item) 
                root.removeChild(option);
        }

        this.value = root.value;
        this.root = root;
    }

    select(item) {
        const root = this.root ?? this.element.querySelector('select');

        if(typeof item == 'number' && item < root.childElementCount)
            root.selectedIndex = item;
        else {
            for(let i = 0; i < root.childElementCount; i++) {
                if(root.childNodes[i].innerText != item) 
                    continue;

                root.selectedIndex = i;
                break;
            }
        }

        this.value = root.value;
        this.root = root;
    }
}
//#endregion

//#region Settings
// NOTE this shit doesn't work when there's text interrupting 
// the buttons so... idk
class Settings {
    static menu = Menu.create();
    static selectedIndex = 0;
    
    static setup() {
        this.menu.add(new MenuHeader("Settings Menu"));
        this.menu.add(new MenuText("text"));
        this.menu.add(new MenuButton("button"));
        this.menu.add(new MenuToggle("checkbox"));

        this.increment(0);
    }

    static increment(n) {
        this.selectedIndex += n;
        this.selectedIndex = Math.min(this.menu.children.length - 1, Math.max(this.selectedIndex, 0));

        let i = 0;
        let increment = Math.sign(n);
        if(increment == 0)
            increment = 1;
        const len = this.menu.children.length ?? 0;
        let constructor = this.menu.children[this.selectedIndex].constructor;
        while(!(constructor.prototype instanceof Selectable)) {
            i++;
            if(i >= len)
                break;
                
            this.selectedIndex += increment;

            if(this.selectedIndex >= len - 1 || this.selectedIndex <= 0) {
                increment *= -1;
                this.selectedIndex += increment;
                continue;
            }
            
            constructor = this.menu.children[this.selectedIndex].constructor;
        }
        
        if(!(this.menu.children[this.selectedIndex].constructor.prototype instanceof Selectable))
            return;

        this.menu.select(this.menu.children[this.selectedIndex]);
    }

    static update() {
        if(Input.getKeyDown('ArrowDown')) {
            this.increment(1);
        }

        if(Input.getKeyDown('ArrowUp')) {
            this.increment(-1);
        }
    }
}
//#endregion

//#region Scenes
class Scene {
    static scenes = {};
    static scene;

    static add(id, start) {
        if(typeof id == 'function') {
            start = id;
            id = null;
        }

        const scene = new Scene(id, start);
        this.scenes[id] = scene;
        return scene;
    }

    static load(id) {
        if(typeof id == 'object') {
            Scene.scenes[id.id] = id;
            id = id.id;
        }

        const scene = Scene.scenes[id];
        if(scene == null)
            return;
        
        Scene.unload();
        Scene.scene = scene.load();
    }

    static unload() {
        for(let i = World.entities.length - 1; i >= 0; i--) {
            if(World.entities[i].preserve)
                continue;
            
            World.entities[i].unload();
            World.entities.splice(i, 1);
        }

        this.scene = null;
    }


    constructor(id, start) {
        if(typeof id == 'function') {
            start = id;
            id = null;
        }

        this.id = id;
        this.start = start ?? (() => { console.log("scene '" + this.id + "' has no start function"); });
    }

    load() {
        this.start();
        return this;
    }
}
//#endregion

//#region Sequencer
class Task {
    ended = false;
    constructor(callback) {
        this.callback = callback ?? (() => {});
    }

    update() {
        this.ended = this.callback();
        return !this.ended;
    }
}

class IntervalTask extends Task {
    interval = 0;
    time = 1; // TODO make this time based not framerate based
    // TODO its not even frame dependent rn its just random
    // NOTE idk i mightve fixed it
    constructor(callback, ticks) {
        super(callback);
        this.interval = (1 / ticks) / Time.frameRate;
    }

    update() {
        this.ended = this.callback(1 - this.time);

        this.time -= this.interval * Time.delta;
        if(this.time <= 0)
            return false;

        return !this.ended;
    }
}

class Sequencer {
    static sequencers = [];
    static update() {
        for(let i = this.sequencers.length - 1; i >= 0; i--) {
            const res = this.sequencers[i].update();
            if(!res)
                continue;
            
            this.sequencers.splice(i, 1);
        }
    }
    
    static create() {
        return new Sequencer();
    }

    task;
    tasks = [];
    current = 0;
    constructor() {
        
    }

    start() {
        Sequencer.sequencers.push(this);
    }

    update() {
        if(this.current >= this.tasks.length) {
            // console.log('finished sequence');
            return true;
        }
        
        if(this.task == null) {
            const opts = this.tasks[this.current];
            this.task = new (opts.prototype)(...opts.args);
        }

        // If the task update returns false, it means it has
        // finished, so we increment the current task by one.
        this.gotoflag = false;
        if(!this.task.update()) {
            if(this.gotoflag) return false; // prevent incrementing if the update already incremented
            this.goto(this.current + 1);
            return false;
        }

        return false;
    }

    goto(index) {
        this.gotoflag = true;
        this.current = index;
        this.task = null;
    }
    
    add(prototype = Task, ...args) {
        if(args == null || args.length <= 0)
            args = [() => {}];
        
        this.tasks.push({ prototype, args }); 
        return this.tasks.length - 1;
    }

    once(callback) {
        return this.add(Task, () => {
            callback();
            return true;
        });
    }
} // NOTE add to the README "return true to end the task"
//#endregion

class Entity {
    graphics = new PIXI.Graphics(); // NOTE this creates a new graphics object for every entity, which might be uneccessary
    preserve = false;
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
    
    onunload() {}
    unload() {
        this.onunload();

        this.removeGraphics();
    }

    ondestroy() {}
    destroy() {
        this.toDestroy = true;
        this.ondestroy();

        this.removeGraphics();
    }

    removeGraphics() {
        graphics.stage.removeChild(this.element);
        this.graphics.destroy();
    }
}

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

    // NOTE only multplying the position change by delta might
    // be a bad idea, but it seems to work
    lateupdate() {
        this.velocity.x += this.acceleration.x;
        this.velocity.y += this.acceleration.y;
        this.acceleration = Vector.zero;
        this.x += this.velocity.x * Time.delta;
        this.y += this.velocity.y * Time.delta;

        this.velocity.setMagnitude(Math.min(this.velocity.magnitude, 10));
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;

        this.angularVelocity += this.angularAcceleration;
        this.angle += this.angularVelocity * Time.delta;
        this.angularAcceleration = 0;
        
        this.angularVelocity = Math.min(Math.abs(this.angularVelocity), 0.015) * Math.sign(this.angularVelocity);
        this.angularVelocity *= this.angularFriction;


        if(this.x < 0) {
            this.x = graphics.view.width;
        }

        if(this.x > graphics.view.width) {
            this.x = 0;
        }

        if(this.y < 0) {
            this.y = graphics.view.height;
        }

        if(this.y > graphics.view.height) {
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

class Circle extends Entity {
    scale = 1;
    constructor(x, y) {
        super(x, y);

        const s = Sequencer.create();
        let startingScale = this.scale;

        const gotopoint = s.add(IntervalTask, t => {
            const i = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
            this.scale = startingScale + (5 - startingScale) * i;
        }, 1);

        s.once(() => startingScale = 5);
        s.add(IntervalTask, t => {
            const i = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
            this.scale = startingScale + (2 - startingScale) * i;
        }, 1);

        s.once(() => startingScale = 2);
        s.add(IntervalTask, t => {
            const i = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
            this.scale = startingScale + (2 - startingScale) * i;
        }, 1);
        
        s.once(() => s.goto(gotopoint));
        s.start();
    }

    start() {
        this.graphics.beginFill(0x6655ff);
        this.graphics.drawCircle(0, 0, 20);
        this.graphics.endFill();

        graphics.stage.addChild(this.graphics);
    }

    updategraphics() {
        this.graphics.position.set(this.x, this.y);
        this.graphics.scale.set(this.scale, this.scale);
    }
}
//#endregion

class World {
    static gamepads = {};
    static entities = [];
    static time;

    static start(setup = () => {}) {
        setup();

        Settings.setup();
        World.update();
    }

    static instantiate(entity) {
        this.entities.push(entity);
        entity.start();
    }

    static update() {
        Time.frames = requestAnimationFrame(World.update); // TODO bring back
        Time.getDelta();
        Input.prep();

        Settings.update();
        Sequencer.update(); // maybe after other things

        World.entities.forEach(entity => entity.update());

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

// for simulating low framerates
// setInterval(() => { //
//     setTimeout(() => {
//         World.update();
//     }, rand(0, 10000));
// }, 10);

// TODO Set framerate n shit here
World.start();

const main = new Scene(() => {
    World.instantiate(new Circle(graphics.view.width/2, graphics.view.height/2));
    World.instantiate(new Agent(graphics.view.width/2, graphics.view.height/2));
});
Scene.load(main);