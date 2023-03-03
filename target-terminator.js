import {defs, tiny} from './examples/common.js';
import {Shape_From_File} from "./examples/obj-file-demo.js";
import {Text_Line} from "./examples/text-demo.js";
import Target from './spawn-random-targets.js';

const {
    Vector, Vector3, Vector4, vec, vec3, vec4, color, hex_color, Shader, Matrix, Mat4, Light, Shape, Material, Scene, Texture,
} = tiny;

const {
    Textured_Phong,
    Basic_Shader
} = defs;

export class Target_Terminator extends Scene {
    /**
     *  **Base_scene** is a Scene that can be added to any display canvas.
     *  Setup the shapes, materials, camera, and lighting here.
     */
    constructor() {
        // constructor(): Scenes begin by populating initial values like the Shapes and Materials they'll need.
        super();

        this.game_state = 0; // 0 = start, 1 = playing, 2 = end
        this.round_time = 0; // Timer for each round
        
        this.targets_array = []; // Array of targets
        // each shape should also store some data about its lifetime
        this.shapes = {
            cube: new defs.Cube(),
            sphere: new defs.Subdivision_Sphere(4),
            donut: new defs.Torus(15, 15),
            teapot: new Shape_From_File("./assets/teapot.obj"),
            text: new Text_Line(35)
        }

        const texture = new defs.Textured_Phong(1);
        const phong = new defs.Phong_Shader();
        const scarlet_color= hex_color("#D21404");

        this.materials = {
            base_target: new Material(phong, {color: scarlet_color,}),
            phong: new Material(new Textured_Phong(), {
                color: hex_color("#ffffff"),
            }),
            texture: new Material(new Textured_Phong(), {
                color: hex_color("#ffffff"),
                ambient: .5, diffusivity: 0.1, specularity: 0.1,
                texture: new Texture("assets/stars.png")
            }),
            menu_button: new Material(phong, {
                color: hex_color('#00ffff'), ambient: 0.5,
                diffusivity: .3, specularity: .2, smoothness: 30
            }),
            text_image: new Material(texture, {
                ambient: 1, diffusivity: 0, specularity: 0,
                texture: new Texture("assets/text.png")
            }),
            basic: new Material(new Basic_Shader()),
            mybasic: new Material(new My_Basic_Shader()),
        }

        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 20), vec3(0, 0, 0), vec3(0, 1, 0));
        this.mouse_position;
        this.options = {
            shapes: {
                cube: false,
                sphere: false,
                donut: false,
                teapot: false
            },
            obstacles: false,
            difficulty: 1
        };
        this.animation_queue = [];
        this.spawned_entities = {}; // store all shapes in scene
    }

    // TEMPORARY: Control Panel to change shapes, speed, etc.
    make_control_panel() {
        this.key_triggered_button("Toggle cube", [], () => {
            this.options.shapes.cube = !this.options.shapes.cube;
        });
        this.new_line();
        this.key_triggered_button("Toggle sphere", [], () => {
            this.options.shapes.sphere = !this.options.shapes.sphere;
        });
        this.new_line();
        this.key_triggered_button("Toggle donut", [], () => {
            this.options.shapes.donut = !this.options.shapes.donut;
        });
        this.new_line();
        this.key_triggered_button("Toggle teapot", [], () => {
            this.options.shapes.teapot = !this.options.shapes.teapot;
        });
        this.new_line();
        this.key_triggered_button("Toggle obstacles", [], () => {
            this.options.obstacles = !this.options.obstacles;
        });
        this.new_line();
        this.key_triggered_button("Cycle Difficulty", [], () => {
            this.options.difficulty += 1;
            if (this.options.difficulty > 3) {
                this.options.difficulty = 1;
            }
        });
        this.live_string(box => {
            box.textContent = "Difficulty: " + this.options.difficulty;
        });

        // Temporary cycle game state
        this.key_triggered_button("Cycle game state", [], () => {
            this.game_state += 1;
            if (this.game_state > 2) {
                this.game_state = 0;
            }
        });
        this.live_string(box => {
            box.textContent = "Game State: " + this.game_state;
        });
    }

    my_mouse_down(e, pos, context, program_state) {
        let pos_ndc_near = vec4(pos[0], pos[1], -1.0, 1.0);
        let pos_ndc_far  = vec4(pos[0], pos[1],  1.0, 1.0);
        let center_ndc_near = vec4(0.0, 0.0, -1.0, 1.0);
        let P = program_state.projection_transform;
        let V = program_state.camera_inverse;
        let pos_world_near = Mat4.inverse(P.times(V)).times(pos_ndc_near);
        let pos_world_far  = Mat4.inverse(P.times(V)).times(pos_ndc_far);
        let center_world_near  = Mat4.inverse(P.times(V)).times(center_ndc_near);
        pos_world_near.scale_by(1 / pos_world_near[3]);
        pos_world_far.scale_by(1 / pos_world_far[3]);
        center_world_near.scale_by(1 / center_world_near[3]);

        // Do whatever you want
        let animation_bullet = {
            from: center_world_near,
            to: pos_world_far,
            start_time: program_state.animation_time,
            end_time: program_state.animation_time + 1000,
        }
        this.animation_queue.push(animation_bullet)
    }

    display_menu(context, program_state, t) {
        const shapes = this.options.shapes;

        // Background
        let background_transform = Mat4.identity();
        background_transform = background_transform.times(Mat4.translation(0, 0, -10)).times(Mat4.scale(20, 20, 0.2));
        this.shapes.cube.draw(context, program_state, background_transform, this.materials.texture);

        // Standard for all option texts
        let option_text_transform = Mat4.identity();
        option_text_transform = option_text_transform.times(Mat4.translation(0.1, -0.9, 0))
                                                    .times(Mat4.scale(.12, .5, 0));

        // Play Button
        let play_button_transform = Mat4.identity();
        play_button_transform = play_button_transform.times(Mat4.translation(-3, 0, 0))
                                                    .times(Mat4.scale(2, 0.7, 0.2))
                                                    .times(Mat4.rotation(0.15, 0, 1, 0));
        this.shapes.cube.draw(context, program_state, play_button_transform, this.materials.menu_button);
        const cube_side = Mat4.rotation(0, 1, 0, 0)
                        .times(Mat4.rotation(0, 0, 1, 0))
                        .times(Mat4.translation(-.9, .9, 1.01));
        let string = "PLAY"
        // Draw a Text_String for every line in our string, up to 30 lines:
        this.shapes.text.set_string(string, context.context);
        this.shapes.text.draw(context, program_state, play_button_transform.times(cube_side)
                                                                            .times(Mat4.translation(0.4, -0.9, 0))
                                                                            .times(Mat4.scale(.2, .4, 0)), this.materials.text_image);

        // Toggle Cube button
        let cube_button_transform = Mat4.identity();
        cube_button_transform = cube_button_transform.times(Mat4.translation(4, 3, 0))
                                                    .times(Mat4.scale(1.7, 0.5, 0.2))
                                                    .times(Mat4.rotation(-0.15, -1, 1, 0));
        this.shapes.cube.draw(context, program_state, cube_button_transform, this.materials.menu_button);
        string = "Cubes:" + (shapes.cube ? "On" : "Off")
        this.shapes.text.set_string(string, context.context);
        this.shapes.text.draw(context, program_state, cube_button_transform.times(cube_side).times(option_text_transform), this.materials.text_image);

        // Toggle Sphere button
        let sphere_button_transform = cube_button_transform;
        sphere_button_transform = sphere_button_transform.times(Mat4.translation(0, -3, 0));                      
        this.shapes.cube.draw(context, program_state, sphere_button_transform, this.materials.menu_button);
        string = "Spheres:" + (shapes.sphere ? "On" : "Off")
        this.shapes.text.set_string(string, context.context);
        this.shapes.text.draw(context, program_state, sphere_button_transform.times(cube_side).times(option_text_transform), this.materials.text_image);

        // Toggle Donut button
        let donut_button_transform = sphere_button_transform;
        donut_button_transform = donut_button_transform.times(Mat4.translation(0, -3, 0));                  
        this.shapes.cube.draw(context, program_state, donut_button_transform, this.materials.menu_button);
        string = "Donuts:" + (shapes.donut ? "On" : "Off")
        this.shapes.text.set_string(string, context.context);
        this.shapes.text.draw(context, program_state, donut_button_transform.times(cube_side).times(option_text_transform), this.materials.text_image);

        // Toggle Teapot button
        let teapot_button_transform = donut_button_transform;
        teapot_button_transform = teapot_button_transform.times(Mat4.translation(0, -3, 0))                     
        this.shapes.cube.draw(context, program_state, teapot_button_transform, this.materials.menu_button);
        string = "Teapots:" + (shapes.teapot ? "On" : "Off")
        this.shapes.text.set_string(string, context.context);
        this.shapes.text.draw(context, program_state, teapot_button_transform.times(cube_side).times(option_text_transform), this.materials.text_image);

        // Cycle Difficulty button
        let difficulty_button_transform = teapot_button_transform;
        difficulty_button_transform = difficulty_button_transform.times(Mat4.translation(0, -3, 0))                     
        this.shapes.cube.draw(context, program_state, difficulty_button_transform, this.materials.menu_button);
        let difficulty = 'Easy';
        switch (this.options.difficulty) {
            case 1:
                difficulty = 'Easy';
                break;
            case 2:
                difficulty = 'Medium';
                break;
            case 3:
                difficulty = 'Hard';
                break;
        }
        string = difficulty;
        this.shapes.text.set_string(string, context.context);
        this.shapes.text.draw(context, program_state, difficulty_button_transform.times(cube_side).times(option_text_transform), this.materials.text_image);

    }

    // @Zinc: u can handle spawning shapes here
    // Method to display shapes in a random position on the screen based on a set of options
    display_shapes(context, program_state, options) {
        const {shapes, obstacles, difficulty} = options; // Destructure options object, difficulty determine how fast objects despawn
        const t = program_state.animation_time / 1000;
        let model_transform = Mat4.identity();
        let exposure_time = 0; //How long a target is exposed for bfr disappearing
        let spawn_time = 0; //How freq a shape is spawned
        switch (difficulty) {
            case 1:
                exposure_time = 5;
                spawn_time = 3;
                break;
            case 2:
                exposure_time = 3;
                spawn_time = 2;
                break;
            case 3:
                exposure_time = 1;
                spawn_time = 1;
                break;
        }

        // Spawn shapes in random positions with random scales
            model_transform = Mat4.identity();
            
            let shape = Object.keys(shapes)[Math.floor(Math.random() * Object.keys(shapes).length)];
            //let scale = Math.random();
            let x = Math.random() * 10 - 5;
            let y = Math.random() * 10 - 5;
            let z = Math.random() * 10 - 5;

            if (Math.floor(t) % spawn_time == 0) { //periodically push into array
                
                if (this.targets_array.length == 0) {
                    let new_target = new Target(x,y,z,t,exposure_time);
                    this.targets_array.push(new_target); 
                    console.log("put in array");
                }
                else if (this.targets_array.length > 0 && Math.floor(this.targets_array[this.targets_array.length - 1].time_created) != Math.floor(t)) {
                    let new_target = new Target(x,y,z,t,exposure_time);
                    this.targets_array.push(new_target); 
                    console.log("put in array");
                }
                
            }
            if (shapes[shape]) {
                for (let i = 0; i < this.targets_array.length; i++) {
                    let target_pos_transform = model_transform.times(Mat4.translation(this.targets_array[i].x, this.targets_array[i].y, this.targets_array[i].z));
                    this.shapes[shape].draw(context, program_state, target_pos_transform, this.materials.base_target);
                }
                // let target_pos_transform = model_transform.times(Mat4.translation(x, y, z));
                // this.shapes[shape].draw(context, program_state, target_pos_transform, this.materials.base_target);
            }
            for (let i = 0; i < this.targets_array.length; i++) { //periodically pop from array
                if (Math.floor(t) - this.targets_array[0].time_created > exposure_time) {
                    this.targets_array.shift();
                    console.log("popped from array");
                }
            }

        if (obstacles){
            // Spawn obstacles that block the user, low priority
            console.log("Obstacles not implemented yet");
        }
    }

    display(context, program_state) {
        if (!context.scratchpad.controls) {
            this.children.push(context.scratchpad.controls = new defs.Movement_Controls());

            // Define the global camera and projection matrices, which are stored in program_state.
            let LookAt = Mat4.look_at(vec3(0, 0, 10), vec3(0, 0, 0), vec3(0, 1, 0));
            program_state.set_camera(LookAt);

            let canvas = context.canvas;
            const mouse_position = (e, rect = canvas.getBoundingClientRect()) =>
                vec((e.clientX - (rect.left + rect.right) / 2) / ((rect.right - rect.left) / 2),
                    (e.clientY - (rect.bottom + rect.top) / 2) / ((rect.top - rect.bottom) / 2));

            canvas.addEventListener("mousedown", e => {
                e.preventDefault();
                this.my_mouse_down(e, mouse_position(e), context, program_state);
            });

            // Track position of mouse within the viewport
            canvas.addEventListener("mousemove", e => {
                e.preventDefault();
                this.mouse_position = mouse_position(e);
                let mouseX = this.mouse_position[0];
                let mouseY = this.mouse_position[1];
                console.log(mouseX, mouseY);
            });

        }

        program_state.projection_transform = Mat4.perspective(
            Math.PI / 4, context.width / context.height, 1, 100);

        const light_position = vec4(10, 10, 10, 1);
        program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];

        let t = program_state.animation_time;
        if (this.animation_queue.length > 0) {
            for (let i = 0; i < this.animation_queue.length; i++) {
                let animation_bullet = this.animation_queue[i];

                let from = animation_bullet.from;
                let to = animation_bullet.to;
                let start_time = animation_bullet.start_time;
                let end_time = animation_bullet.end_time;

                if (t <= end_time && t >= start_time) {
                    let animation_process = (t - start_time) / (end_time - start_time);
                    let position = to.times(animation_process).plus(from.times(1 - animation_process));

                    let model_trans = Mat4.translation(position[0], position[1], position[2])
                        .times(Mat4.rotation(animation_process * 50, .3, .6, .2))
                    this.shapes.teapot.draw(context, program_state, model_trans, this.materials.texture);
                }
            }
        }
        
        // game state case
        switch (this.game_state) {
            case 0: 
                this.display_menu(context, program_state, t) // menu
                program_state.set_camera(Mat4.look_at(vec3(0, 0, 10), vec3(0, 0, 0), vec3(0, 1, 0))); // fix camera
                break;
            case 1:
                this.display_shapes(context, program_state, this.options, t);
                break;
            case 2:
                // game over
                break;
            default:
                break;
        }

        // remove finished animation
        while (this.animation_queue.length > 0) {
            if (t > this.animation_queue[0].end_time) {
                this.animation_queue.shift();
            }
            else {
                break;
            }
        }
    }
}

class My_Basic_Shader extends Basic_Shader {
    shared_glsl_code() {
        // ********* SHARED CODE, INCLUDED IN BOTH SHADERS *********
        return `precision mediump float;
                varying vec4 VERTEX_COLOR;
                varying vec3 VERTEX_POSITION;
                uniform float animation_time;
            `;
    }

    vertex_glsl_code() {
        // ********* VERTEX SHADER *********
        return this.shared_glsl_code() + `
                attribute vec4 color;
                attribute vec3 position;
                // Position is expressed in object coordinates.
                uniform mat4 projection_camera_model_transform;

                void main(){
                    // Compute the vertex's final resting place (in NDCS), and use the hard-coded color of the vertex:
                    gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
                    VERTEX_COLOR = color;
                    VERTEX_POSITION = position;
                }`;
    }

    fragment_glsl_code() {
        return this.shared_glsl_code() + `
            void main(){
                // The interpolation gets done directly on the per-vertex colors:
                float alpha = sin(animation_time) / 2.0 + 0.5;
                if (mod(VERTEX_POSITION.x + animation_time, 0.5) > 0.25) {
                    gl_FragColor = vec4(VERTEX_POSITION / 3.0, alpha);
                } else {
                    gl_FragColor = vec4(VERTEX_COLOR.xyz, 1.0 - alpha);
                }
            }`;
    }

    update_GPU(context, gpu_addresses, gpu_state, model_transform, material) {
        // update_GPU(): Add a little more to the base class's version of this method.
        super.update_GPU(context, gpu_addresses, gpu_state, model_transform, material);
        context.uniform1f(gpu_addresses.animation_time, gpu_state.animation_time / 1000);
    }
}