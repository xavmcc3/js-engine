/**
    ==========================================================
        @section User Code
        @author Xav
    ==========================================================
*/

import * as Engine from './lib/engine.js';
Object.assign(globalThis, Engine);

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
        this.graphics.position.set(this.x, this.y);
        graphics.stage.addChild(this.graphics);
    }

    update() {
        this.addForce(new Vector(0, this.gravity));

        const gamepad = Input.getGamepadHandler(0);

        this.tl = gamepad?.getButtonValue(6) ?? Input.getKey('ArrowLeft');
        this.tr = gamepad?.getButtonValue(7) ?? Input.getKey('ArrowRight');

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
        // NOTE the delta time multiplication is only
        // an approximation and therefore isn't 
        // perfect, but it's close enough
        this.velocity.x += this.acceleration.x * Time.delta;
        this.velocity.y += this.acceleration.y * Time.delta;
        this.x += this.velocity.x * Time.delta;
        this.y += this.velocity.y * Time.delta;
        
        this.velocity.setMagnitude(Math.min(this.velocity.magnitude, 10));
        this.velocity.x *= this.friction;
        this.velocity.y *= this.friction;
        
        this.angularVelocity += this.angularAcceleration * Time.delta;
        this.angle += this.angularVelocity * Time.delta;
        
        this.acceleration = Vector.zero;
        this.angularAcceleration = 0;
        
        this.angularVelocity = Math.min(Math.abs(this.angularVelocity), 0.015) * Math.sign(this.angularVelocity);
        this.angularVelocity *= this.angularFriction * Time.delta;


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
        this.graphics.position.set(this.x, this.y);
        graphics.stage.addChild(this.graphics);
    }

    update() {
        this.x += this.velocity.x * Time.delta;
        this.y += this.velocity.y * Time.delta;
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

        this.graphics.position.set(this.x, this.y);
        graphics.stage.addChild(this.graphics);
    }

    updategraphics() {
        this.graphics.position.set(this.x, this.y);
        this.graphics.scale.set(this.scale, this.scale);
    }
}
//#endregion

//#region TEMP Example Menu
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

//#region TEMP Example Shader
await Graphics.setGraphicsShader('./shaders/fragment.frag');
//#endregion

// for simulating low framerates
// setInterval(() => { //
//     setTimeout(() => {
//         World.update();
//     }, rand(0, 10000));
// }, 10);

// TODO Set framerate n shit here

const main = new Scene(() => {
    World.instantiate(new Circle(graphics.view.width/2, graphics.view.height/2));
    World.instantiate(new Agent(graphics.view.width/2, graphics.view.height/2));
});

Scene.load(main);
World.start();