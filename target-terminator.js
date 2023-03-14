import { defs, tiny } from "./examples/common.js";
import { Shape_From_File } from "./examples/obj-file-demo.js";
import { Text_Line } from "./examples/text-demo.js";
import Target from "./target.js";
import FirstPersonCamera from "./first-person-camera.js";
import DisplayMenu from "./display-menu.js";
import DisplayBackground from "./display-background.js";

const {
  vec,
  vec4,
  color,
  hex_color,
  Mat4,
  Light,
  Material,
  Scene,
  Texture,
} = tiny;
const { Textured_Phong, Basic_Shader } = defs;


export class Target_Terminator extends Scene {
  constructor() {
    super();
    this.game_state = 0; // 0 = start, 1 = playing, 2 = end
    this.game_score = 0;
    this.round_time = 60; // Timer for each round

    this.targets_array = []; // Array of targets
    this.shapes = {
        cube: new defs.Cube(),
        sphere: new defs.Subdivision_Sphere(4),
        donut: new defs.Torus(15, 15),
        teapot: new Shape_From_File("./assets/teapot.obj"),
        text: new Text_Line(35),
        desert_plane: new Shape_From_File("./assets/desert_plane.obj"),
        rock: new (defs.Subdivision_Sphere.prototype.make_flat_shaded_version())(2),
        cactus: new Shape_From_File("./assets/cactus.obj"),
        blocky_cactus: new Shape_From_File("./assets/blocky_cactus.obj"),
    }

    const texture = new defs.Textured_Phong(1);
    const phong = new defs.Phong_Shader();
    const scarlet_color = hex_color("#D21404");
    const green = hex_color("#00FF00");

    this.materials = {
      base_target: new Material(phong, { color: scarlet_color }),
      obstacle: new Material(phong, { color: green }),
      phong: new Material(new Textured_Phong(), {
        color: hex_color("#ffffff"),
        ambient: 1
      }),
      texture: new Material(new Textured_Phong(), {
        color: hex_color("#ffffff"),
        ambient: 0.5,
        diffusivity: 0.1,
        specularity: 0.1,
        texture: new Texture("assets/stars.png"),
      }),
      menu_button: new Material(phong, {
        color: hex_color("#00ffff"),
        ambient: 0.5,
        diffusivity: 0.3,
        specularity: 0.2,
        smoothness: 30,
      }),
      text_image: new Material(texture, {
        ambient: 1,
        texture: new Texture("assets/text.png")
      }),
      score_text: new Material(texture, {
        ambient: 0.5,
        texture: new Texture("assets/text.png"),
        color: hex_color("#00FF00"),
      }),
      timer_text: new Material(texture, {
        ambient: 0.5,
        texture: new Texture("assets/text.png"),
        basic: new Material(new Basic_Shader()),
        color: hex_color("#FF0000"),
      }),
      mybasic: new Material(new My_Basic_Shader()),
            sky: new Material(new defs.Phong_Shader(), {
                color: hex_color("#87CEEB"), 
                ambient: 1, diffusivity: 0, specularity: 0,
            }),
            ground: new Material(new defs.Phong_Shader(), {
                color: hex_color("#C2B280"),
                ambient: 0.6, diffusivity: 1, specularity: 1,
            }),
            sun: new Material(new defs.Phong_Shader(), {
                color: hex_color("#FFE87C"),
                ambient: 1, specularity: 0,
            }),
            rock: new Material(new defs.Phong_Shader(), {
                color: hex_color("#808080"),
                ambient: 0.6, diffusivity: 1, specularity: 0,
            }),
            cactus: new Material(new defs.Phong_Shader(), {
                color: hex_color("#5C755E"),
                ambient: 1, diffusivity: 0, specularity: 0,
            }),
    };
    this.camera = new FirstPersonCamera(0, 0, 10);
  
    this.options = {
      toggleShapes: {
        cube: false,
        sphere: false,
        donut: false,
        teapot: false,
      },
      obstacles: false,
      difficulty: 1,
      sensitivity: 1
    };
    this.animation_queue = [];
  }

  // TEMPORARY: Control Panel to change shapes, speed, etc.
  make_control_panel() {
    this.key_triggered_button("Toggle cube", ["c"], () => {
      this.options.toggleShapes.cube = !this.options.toggleShapes.cube;
    });
    this.new_line();
    this.key_triggered_button("Toggle sphere", ["s"], () => {
      this.options.toggleShapes.sphere = !this.options.toggleShapes.sphere;
    });
    this.new_line();
    this.key_triggered_button("Toggle donut", ["d"], () => {
      this.options.toggleShapes.donut = !this.options.toggleShapes.donut;
    });
    this.new_line();
    this.key_triggered_button("Toggle teapot", ["t"], () => {
      this.options.toggleShapes.teapot = !this.options.toggleShapes.teapot;
    });
    this.new_line();
    this.key_triggered_button("Toggle obstacles", ["o"], () => {
      this.options.obstacles = !this.options.obstacles;
    });
    this.new_line();
    this.key_triggered_button("Cycle Difficulty", ["Control", "d"], () => {
      this.options.difficulty += 1;
      if (this.options.difficulty > 3) {
        this.options.difficulty = 1;
      }
    });
    this.live_string((box) => {
      box.textContent = "Difficulty: " + this.options.difficulty;
    });

    this.key_triggered_button("Cycle game state", ["Control", "g"], () => {
      this.game_state += 1;
      if (this.game_state > 2) {
        this.game_state = 0;
      }
    });
    this.live_string((box) => {
      box.textContent = "Game State: " + this.game_state;
    });

    this.key_triggered_button("Cycle Sensitivity", ["Control", "s"], () => {
      this.options.sensitivity += 1;
      if (this.options.sensitivity > 5) {
        this.options.sensitivity = 1;
      }
    });
    this.live_string((box) => {
      box.textContent = "Sensitivity: " + this.options.sensitivity;
    });
  }

  fire_ray(e, pos, context, program_state) {
    let pos_ndc_near = vec4(pos[0], pos[1], -1.0, 1.0);
    let pos_ndc_far = vec4(pos[0], pos[1], 1.0, 1.0);
    let center_ndc_near = vec4(0.0, 0.0, -1.0, 1.0);
    let P = program_state.projection_transform;
    let V = program_state.camera_inverse;
    let pos_world_near = Mat4.inverse(P.times(V)).times(pos_ndc_near);
    let pos_world_far = Mat4.inverse(P.times(V)).times(pos_ndc_far);
    let center_world_near = Mat4.inverse(P.times(V)).times(center_ndc_near);
    pos_world_near.scale_by(1 / pos_world_near[3]);
    pos_world_far.scale_by(1 / pos_world_far[3]);
    center_world_near.scale_by(1 / center_world_near[3]);

    // Do whatever you want
    let animation_bullet = {
      from: center_world_near,
      to: pos_world_far,
      start_time: program_state.animation_time,
      end_time: program_state.animation_time + 1000,
    };
    this.animation_queue.push(animation_bullet);
  }

  // Method to display shapes in a random position on the screen based on a set of options
  display_shapes(context, program_state, options) {
    const { toggleShapes, obstacles, difficulty } = options; // Destructure options object, difficulty determine how fast objects despawn
    const t = program_state.animation_time / 1000;
    let model_transform = Mat4.identity();

    let exposure_time = 0; //How long a target is exposed for bfr disappearing
    let spawn_freq = 0; //How freq a shape is spawned
    switch (difficulty) {
      case 1:
        exposure_time = 4;
        spawn_freq = 3;
        break;
      case 2:
        exposure_time = 3;
        spawn_freq = 2;
        break;
      case 3:
        exposure_time = 1.5;
        spawn_freq = 1;
        break;
    }

    // Spawn Boundaries
    let left_bound = -10;
    let right_bound = 20;
    let bottom_bound = 1;
    let top_bound = 5;
    let back_bound = -7;
    let front_bound = 2;

    // periodically push into array
    if (Math.floor(t) % spawn_freq == 0) {
      //generate random shape
      let shape_index = 0;
      let index = Math.floor(Math.random() * 4);
      switch (index) {
        case 0:
          shape_index = "cube";
          break;
        case 1:
          shape_index = "sphere";
          break;
        case 2:
          shape_index = "donut";
          break;
        case 3:
          shape_index = "teapot";
          break;
      }

      if (toggleShapes[shape_index] == true) {
        let x = Math.random() * right_bound + left_bound;
        let y = Math.random() * top_bound + bottom_bound;
        let z = Math.random() * front_bound + back_bound;
        let new_target;

        // If array is empty, randomly spawn target
        if (this.targets_array.length == 0){
          new_target = new Target(x, y, z, t, exposure_time, shape_index);
          this.targets_array.push(new_target);
        }
        // If it's time to spawn a new object, spawn next object close to but not overlapping with last object
        else if (Math.floor(t) - Math.floor(this.targets_array[this.targets_array.length - 1].time_created) >= spawn_freq){
          let last_x = this.targets_array[this.targets_array.length - 1].x;
          let last_y = this.targets_array[this.targets_array.length - 1].y;
          x = x - last_x*0.5;
          y = y - last_y*0.5;
          new_target = new Target(x, y, z, t, exposure_time, shape_index);

          // Have 20% chance of obstacle spawning given that obstacles are toggled on
          if (obstacles){
            let spawn_obstacle = Math.random() * 5;
            if (Math.floor(spawn_obstacle) == 1){
              new_target = new Target(x, y, z, t, exposure_time, shape_index, true);
            }
          }
          this.targets_array.push(new_target);
        }
      }
    }

    //display all shapes in array
    for (let i = 0; i < this.targets_array.length; i++) {
      let target_pos_transform = model_transform.times(
        Mat4.translation(
          this.targets_array[i].x,
          this.targets_array[i].y,
          this.targets_array[i].z
        )
      );
      let material = this.targets_array[i].obstacle ? this.materials.obstacle : this.materials.base_target;
      if (this.targets_array[i].shape == "cube") {
        this.shapes.cube.draw(
          context,
          program_state,
          target_pos_transform,
          material
        );
      } else if (this.targets_array[i].shape == "sphere") {
        this.shapes.sphere.draw(
          context,
          program_state,
          target_pos_transform,
          material
        );
      } else if (this.targets_array[i].shape == "donut") {
        this.shapes.donut.draw(
          context,
          program_state,
          target_pos_transform,
          material
        );
      } else if (this.targets_array[i].shape == "teapot") {
        this.shapes.teapot.draw(
          context,
          program_state,
          target_pos_transform,
          material
        );
      }
    }

    //pop shapes from array if they have been exposed for too long
    for (let i = 0; i < this.targets_array.length; i++) {
      //periodically pop from array
      if (Math.floor(t) - this.targets_array[0].time_created > exposure_time) {
        this.targets_array.shift();
      }
    }
  }

  target_hit_callback(i) {
    let target = this.targets_array[i];
    if (target.obstacle){
      this.game_score -= 10;
    } else {
      this.game_score += 10;
    }
    this.targets_array.splice(i,1)
    console.log("Target " + i + " hit!")
  }

  timer_countdown() {
    this.game_timer -= 1;
    if (this.game_timer == 0) {
      this.game_state = 2;
    }
  }

  pointerLockChangeCallback(canvas) {
    if (document.pointerLockElement === canvas){
      console.log("enter")
    } else {
      console.log("exit")
    }
  }
  
  display(context, program_state) {
    let lookAt = this.camera.lookAt;
    let canvas = context.canvas;
    program_state.set_camera(lookAt);
    
    if (!context.scratchpad.controls) {
      const mouse_position = (e, rect = canvas.getBoundingClientRect()) => vec(
        (e.clientX - (rect.left + rect.right) / 2) / ((rect.right - rect.left) / 2), 
        (e.clientY - (rect.bottom + rect.top) / 2) / ((rect.top - rect.bottom) / 2)
      );
      
      // Added pointer lock to the game. https://developer.mozilla.org/en-US/docs/Web/API/Pointer_Lock_API
      canvas.addEventListener("mousedown", async (e) => {
        e.preventDefault();
        if (!document.pointerLockElement && this.game_state == 1){
          await canvas.requestPointerLock();
        }
        canvas.addEventListener("mousemove", (e) => {
          let del_x = e.movementX;
          let del_y = e.movementY;
          if (this.game_state == 1){
            this.camera.update_view(del_x, del_y, this.options.sensitivity);
          }
        });
        this.fire_ray(e, mouse_position(e), context, program_state);
      }, {once: true});
    }

    program_state.projection_transform = Mat4.perspective(Math.PI / 4, context.width / context.height, 1, 100);

    const light_position = vec4(10, 10, 10, 1);
    program_state.lights = [new Light(light_position, color(1, 1, 1, 1), 1000)];
    program_state.lights = [new Light(vec4(0,-30,-10,1), hex_color("#FFF2B3"), 1000)];

    let t = program_state.animation_time;

    // if (t  == 0) {
    //   timer_countdown();
    // }

    if (this.animation_queue.length > 0) {
      for (let i = 0; i < this.animation_queue.length; i++) {
        let animation_bullet = this.animation_queue[i];

        let from = animation_bullet.from;
        let to = animation_bullet.to;
        let start_time = animation_bullet.start_time;
        let end_time = animation_bullet.end_time;

        if (t <= end_time && t >= start_time) {
          let animation_process = (t - start_time) / (end_time - start_time);
          let position = to
            .times(animation_process)
            .plus(from.times(1 - animation_process));
          // Check intersection for targets
          if (this.game_state == 1) {
            for (let i = 0; i < this.targets_array.length; i++) {
              // Calculate distance of cube to ray
              let distanceX = Math.abs(this.targets_array[i].x - position[0]);
              let distanceY = Math.abs(this.targets_array[i].y - position[1]);
              let distanceZ = Math.abs(this.targets_array[i].z - position[2]);
              if (distanceX < 2 && distanceY < 2 && distanceZ < 2) {
                this.target_hit_callback(i)
                // End ray cast
                this.animation_queue.shift();
              }
            }
          }
        }
      }
    }
    
    // game state case
    switch (this.game_state) {
      case 0:
        program_state.set_camera(this.camera.default);
        DisplayMenu(context, program_state, this.options, this.shapes, this.materials);
        break;
      case 1:
        this.display_shapes(context, program_state, this.options, t);
        DisplayBackground(context, program_state, this.shapes, this.materials);
        this.camera.draw_ui(context, program_state, this.shapes, this.materials, this.game_score, this.round_time);
        break;
      case 2:
        program_state.set_camera(this.camera.default);
        if (document.pointerLockedElement === canvas){
          console.log('pointer unlocked');
          document.exitPointerLock();
        }
        break;
      default:
        break;
    }

    // remove finished animation
    while (this.animation_queue.length > 0) {
      if (t > this.animation_queue[0].end_time) {
        this.animation_queue.shift();
      } else {
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
    return (
      this.shared_glsl_code() +
      `
                attribute vec4 color;
                attribute vec3 position;
                // Position is expressed in object coordinates.
                uniform mat4 projection_camera_model_transform;

                void main(){
                    // Compute the vertex's final resting place (in NDCS), and use the hard-coded color of the vertex:
                    gl_Position = projection_camera_model_transform * vec4( position, 1.0 );
                    VERTEX_COLOR = color;
                    VERTEX_POSITION = position;
                }`
    );
  }

  fragment_glsl_code() {
    return (
      this.shared_glsl_code() +
      `
            void main(){
                // The interpolation gets done directly on the per-vertex colors:
                float alpha = sin(animation_time) / 2.0 + 0.5;
                if (mod(VERTEX_POSITION.x + animation_time, 0.5) > 0.25) {
                    gl_FragColor = vec4(VERTEX_POSITION / 3.0, alpha);
                } else {
                    gl_FragColor = vec4(VERTEX_COLOR.xyz, 1.0 - alpha);
                }
            }`
    );
  }

  update_GPU(context, gpu_addresses, gpu_state, model_transform, material) {
    // update_GPU(): Add a little more to the base class's version of this method.
    super.update_GPU(
      context,
      gpu_addresses,
      gpu_state,
      model_transform,
      material
    );
    context.uniform1f(
      gpu_addresses.animation_time,
      gpu_state.animation_time / 1000
    );
  }
}
