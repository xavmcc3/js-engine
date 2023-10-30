/**
    ==========================================================
        @section User Code
        @author Xav
    ==========================================================
*/

import * as Engine from './lib/engine.js';
Object.assign(globalThis, Engine);


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