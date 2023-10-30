/**
    ==========================================================
        @section Engine
        @author xav
    ==========================================================
*/

//#region Imports & Stats
import Stats from 'https://cdnjs.cloudflare.com/ajax/libs/stats.js/17/Stats.js'

const stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);
//#endregion

// TODO make sure to set the graphics positions before adding 
// them to the stage in all cases --> menus & entities 
// especially
// TODO move more of the graphics initialization to the Graphics
// class
// #region Graphics
const pixijsParent = document.querySelector('#pixijs');
export const graphics = new PIXI.Application({
    backgroundColor: 0x5E5E5E,
    resizeTo: pixijsParent
});

pixijsParent.appendChild(graphics.view);

export class Graphics {
    static app = graphics;

    static uniforms = {
        'iResolution': { x: 0.0, y: 0.0 },
        'iTime': 0.0,

        'tint_amount': 0.0,
        'aspect': 1.0,
        'time': 0.0
    };

    static async fetchShader(path) {
        const res = await fetch(path);
        return await res.text();
    }

    static async setGraphicsShader(path, uniforms) {
        const fragment = await Graphics.fetchShader(path);
        const shader = new PIXI.Filter('', fragment, uniforms ?? Graphics.uniforms);

        graphics.stage.filterArea = graphics.screen;
        graphics.stage.filters = [shader];
    }
}
// #endregion

//#region Utils
const hexMap = "0123456789abcdef";

export function rand(min, max) {
    return (Math.random() * (max - min + 1)) + min;
}

export async function fetchFile(path) {
    const res = await fetch(path);
    return await res.text();
}

export class Vector {
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
export class Time {
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

// BUG Input.getTopGamepadHandler returns null
//#region Input
export class GamepadHandler {
    buttons = {};
    values = {};
    axes = {};
    
    haptics;

    constructor(gamepad) {
        this.index = gamepad.index;
        this.haptics = gamepad.vibrationActuator;

        this.pulse(1.0, 80);
    }

    update(gamepad) {
        if(!gamepad)
            return;

        for(const index in gamepad.buttons) {
            this.values[index] = gamepad.buttons[index].value;
            const pressed = gamepad.buttons[index].pressed;
            let value = pressed ? 1 : null;
            if(value > 0 && this.buttons[index] > 0)
                value++;
            
            this.buttons[index] = value;
        }

        for(const index in gamepad.axes) {
            this.axes[index] = gamepad.axes[index];
        }
    }

    getButton(index) {
        return this.buttons[index] > 0;
    }

    getButtonDown(index) {
        return this.buttons[index] == 1;
    }

    getButtonValue(index) {
        return this.values[index];
    }

    getAxis(index) {
        return this.axes[index];
    }

    playHapticEffect(options = {}) {
        const type = this.haptics.type;
        if(!this.haptics)
        return;
        
        this.haptics.playEffect(type, options);
    }

    pulse(value = 1.0, duration = 100) {
        const options = {
            startDelay: 0,
            duration: duration,
            weakMagnitude: value,
            strongMagnitude: 0,
        };

        this.playHapticEffect(options);
    }
}

export class Input {
    static x = 0;
    static y = 0;

    static sensitivity = 40;
    static interval = 0;
    static count = 0;

    static down = []
    static pressed = []

    static gamepadHandlers = []
    static gamepadCount = 0;

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

    static getGamepadButton(index) {
        for(const gamepadHandler of this.gamepadHandlers) {
            if(gamepadHandler.getButton(index))
                return true;
        }

        return false;
    }

    static getGamepadButtonDown(index) {
        for(const gamepadHandler of this.gamepadHandlers) {
            if(gamepadHandler.getButtonDown(index))
                return true;
        }

        return false;
    }

    static getGamepadHandler(index) {
        return this.gamepadHandlers[index];
    }

    static getTopGamepadHandler() {
        return this.getGamepadHandler(this.gamepadHandlers.slice(-1)[0]);
    }

    static addGamepad(info) {
        const tracker = new GamepadHandler(info);
        Input.gamepadHandlers[info.index] = tracker;
        this.gamepadCount++;
    }

    static removeGamepad(info) {
        Input.gamepadHandlers.splice(info.index, 1);
        this.gamepadCount--;
    }

    static update() {
        this.pressed = [...Input.down];
        const gamepads = navigator.getGamepads();
        for(const gamepadHandler of this.gamepadHandlers) {
            gamepadHandler.update(gamepads[gamepadHandler.index]);
        }
    }

    static prep() {
        // NOTE any pre-frame initalization
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
export class Process {
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

// TODO make menus work with the Scene system
// TODO Also make Graph Menus (on a new branch)
// NOTE Not destroing the graphics objects of the menu items
// is basically a memory leak, so idfk. It might not be tho
// TODO add support for exit animations
// and immediate destruction options
//#region Menus

export class MenuItem {
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

        this.graphics.position.set(this.x, this.y);
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
export class MenuBlank extends MenuItem {
    constructor() {
        super();
    }

    initialize() {}

    start() {}

    render() {}
}

export class MenuText extends MenuItem {
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

        this.graphics.position.set(this.x, this.y);
        text.position.set(0, -fontSize / 2);
        this.graphics.addChild(text);
    }
}
//#endregion

//#region Selectables
export class Selectable extends MenuItem {
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

export class SelectableText extends Selectable {
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

        this.graphics.position.set(this.x, this.y);
        text.position.set(0, -fontSize / 2);
        this.graphics.addChild(text);
        this.text = text;
    }
}

export class Button extends SelectableText {
    constructor(content, callback) {
        super();

        this.callback = callback ?? (() => {});
        this.content = content ?? "button with no text :o";
    }

    input() {
        if(Input.getGamepadButtonDown(0))
            this.callback();

        if(Input.getKeyDown('Enter'))
            this.callback();
    }
}
//#endregion

//#region Menu Layouts
export class Menu {
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
    inputCooldown = 0;
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
        this.axisWasReset = 0;
        
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
        const gamepad = Input.getGamepadHandler(0);
        if(Input.getKeyDown('ArrowDown') || Input.getGamepadButtonDown(13)) {
            this.inputCooldown = 3;
            this.increment(1);
        }

        if(Input.getKeyDown('ArrowUp') || Input.getGamepadButtonDown(12)) {
            this.inputCooldown = 3;
            this.increment(-1);
        }

        this.axisInput(gamepad);
        this.continuousInput(gamepad);

        this.axisWasReset |= Math.abs(gamepad?.getAxis(1)) < 0.2;
        this.selectables[Math.floor(this.selected)]?.input();
    }

    axisInput(gamepad) {
        if(!this.axisWasReset)
            return;

        if(gamepad?.getAxis(1) > 0.4) {
            this.axisWasReset = false;
            this.inputCooldown = 3;
            this.increment(1);
        }

        if(gamepad?.getAxis(1) < -0.4) {
            this.axisWasReset = false;
            this.inputCooldown = 3;
            this.increment(-1);
        }
    }

    continuousInput(gamepad) {
        this.inputCooldown -= 0.1 * Time.delta;
        if(this.inputCooldown > 0)
            return;
        
        if(Input.getKey('ArrowDown') || Input.getGamepadButton(13) || gamepad?.getAxis(1) > 0.4) {
            this.inputCooldown = 0.6;
            this.increment(1);
        }

        if(Input.getKey('ArrowUp') || Input.getGamepadButton(12) || gamepad?.getAxis(1) < -0.4) {
            this.inputCooldown = 0.6;
            this.increment(-1);
        }
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

        this.selectables[Math.floor(this.selected)]?.deselect();

        this.selected = Math.max(0, Math.min(this.selectables.length - 1, index));
        this.selectables[Math.floor(this.selected)].select();
    }

    increment(amount) {
        this.select(this.selected + amount);
    }
    
    tick() {}

    setup(index, item) {}
}

export class ScrollingMenu extends Menu {
    constructor(name, x, y, smoothing, ...items) {
        super(name, x, y, ...items);
        this.smoothing = smoothing ?? 10;
        this.startY = y ?? 0;
    }

    tick() {
        const target = this.selectables[Math.floor(this.selected)].y * -1;
        this.y = this.y + (target + this.startY - this.y) / this.smoothing;
    }

    setup(index, item) {
        item.y= index * 25;
    }
}
//#endregion
//#endregion

//#region Scenes
export class Scene {
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

// TODO add a 'halt' block that functions like a 
// return
//#region Sequencer
export class Task {
    ended = false;
    constructor(callback) {
        this.callback = callback ?? (() => {});
    }

    update() {
        this.ended = this.callback();
        return !this.ended;
    }
}

export class IntervalTask extends Task {
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

export class Sequencer {
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

export class Entity {
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
        this.graphics.position.set(this.x, this.y);
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

// NOTE processes and menus might get 
// messed up on scene changes
export class World {
    static gamepads = {};
    static entities = [];
    static time;

    static start(setup = () => {}) {
        setup();

        World.update();
    }

    static instantiate(entity) {
        this.entities.push(entity);
        entity.start();
    }

    static update() {
        Time.frames = Graphics.uniforms.iTime = Graphics.uniforms.time = requestAnimationFrame(World.update); // TODO bring back
        Graphics.uniforms.aspect = graphics.view.height / graphics.view.width;
        Graphics.uniforms.iResolution.y = graphics.view.height;
        Graphics.uniforms.iResolution.x = graphics.view.width;

        stats.begin();
        Time.getDelta();
        Input.prep();

        Sequencer.update(); // maybe after other things

        Menu.update();

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
        stats.end();
    }
}