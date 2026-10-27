# Plan guide

Short map of the work described in [`plan.txt`](plan.txt).

**Progress** is the ratio of checked task boxes in that area’s plan (`checked/total`). An area with no plan document yet is marked `no plan`.

| Area | Progress |
|------|----------|
| General | no plan |
| Rendering | no plan |
| Grid system | no plan |
| Scenario-driven showcase | no plan |
| Scenario builder | no plan |
| Model loader | no plan |
| Playback | no plan |

## General

WordPress-compatible plugin, bundled with Vite and developed through `npm run dev` and `preview.html`. Includes `AGENTS.md`, docs split into general and feature folders, technology guides, a README that covers local development and installing the plugin in WordPress (what to zip, how to upload, how it appears on a page), a current PHP requirement, and publishing the repo to GitHub.

## Rendering

Three.js only draws what it is given: models or defined shapes, each tied to a grid object. Lighting, materials, and development helpers belong here. The 2D software view is a top-down companion of the 3D scene and keeps the product’s own layout.

## Grid system

A separate grid engine, driven by fixed constants, defines floor and wall planes. The floor grid is the main grid; walls aggregate from it and keep their own cells. Paths, zones, and static objects live on that grid. Moving objects occupy cells as they enter them. The engine prevents collisions and reports zone enter and leave. Entities other than zones stay within one cell. Zones are project-specific and are not collision volumes.

## Scenario-driven showcase

Each scenario is a predefined, typed setup: grid positions plus rules such as continuous or settable playback and orbital control. The 3D view and the software view stay in sync from the same grid. Storing scenarios as JSON is still an open choice.

## Scenario builder

An interactive builder where someone assembles a scenario and saves it. Placement goes through the grid so only valid cells are used. A UI lets the user pick objects and turn scenario options on or off.

## Model loader

Showcase objects load as `.glb` files, scaled to the world size. The set of models stays limited so the scene stays performant. WebGPU is worth a later look if that limit becomes tight.

## Playback

How playback should look and behave still needs its own plan. The source note only records that the interaction is undecided.
