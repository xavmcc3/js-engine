<p style="text-align:center" align="center">
    <img src="src/js.png"  width="200">
</p>

# <img src="src/js-simple.png"  width="25"> Js Engine
A Game Engine developed in JavaScript used for quick prototyping and easy development. Documentation still isn't done.

The engine is made up of a series of systems that tie into a larger class. Game Objects are called Entites and can be extended with child classes.
Uses pixijs for rendering and that JS library for statuses.

## Why
As I've developed games in JavaScript, this engine started to take shape. I decided to clean it up and keep it in one place.

## Getting Started

Include the main JavaScript file in your html page somehow.
```html
<script src="app.js" defer></script>
```

A game can be created with the following code.
```js
const main = new Scene(() => {
    World.instantiate(new Circle(graphics.view.width/2, graphics.view.height/2));
    World.instantiate(new Agent(graphics.view.width/2, graphics.view.height/2));
});

Scene.load(main);
World.start();
```

New Game Entities can be created by extending the `Entity` class.

## Documentation
really dont wanna write this fr fr ong

## Processes

## Entities

## Input

## GamepadHandler

## Sequencer

## Scenes

## Menus

## Shaders

## Vectors

## The `rand` Function

it is what it is
