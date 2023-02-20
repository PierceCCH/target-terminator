import {defs, tiny} from './examples/common.js';
import {Shape_From_File} from "./examples/obj-file-demo.js";

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

        this.shapes = {
            teapot: new Shape_From_File("./assets/teapot.obj"),
        }

        const bump = new defs.Fake_Bump_Map();
        
        this.materials = {
            phong: new Material(new Textured_Phong(), {
                color: hex_color("#ffffff"),
            }),
            texture: new Material(new Textured_Phong(), {
                color: hex_color("#ffffff"),
                ambient: .5, diffusivity: 0.1, specularity: 0.1,
                texture: new Texture("assets/stars.png")
            }),
            basic: new Material(new Basic_Shader()),
            mybasic: new Material(new My_Basic_Shader()),
        }

        this.initial_camera_location = Mat4.look_at(vec3(0, 10, 20), vec3(0, 0, 0), vec3(0, 1, 0));
        this.mouse_position;
        this.animation_queue = [];
    }

    make_control_panel() {
        // TODO: Control Panel to change shapes, speed, etc.
        
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

            // Track position of mouse within the viewport - Pierce
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