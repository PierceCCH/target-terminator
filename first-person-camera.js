// Defines a first person camera that can be controlled by the mouse
import { tiny } from "./examples/common.js";
const {vec3, Mat4} = tiny

export default class FirstPersonCamera {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.at = vec3(0, 0, 1);
    this.lookAt = Mat4.look_at(vec3(x, y, z), this.at, vec3(0, 1, 0));
    this.default = Mat4.look_at(vec3(x, y, z), vec3(0, 0, 1), vec3(0, 1, 0));
    
    this.theta = 0;
    this.phi = 0;
  }

  update_view(del_x, del_y, sensitivity) {
    this.theta += del_x * (sensitivity * 0.75) / 50000;
    this.phi += (-1) * del_y * (sensitivity * 0.75) / 50000;
    this.at = vec3(this.theta, this.phi, 1)
    this.lookAt = Mat4.look_at(vec3(this.x, this.y, this.z), this.at, vec3(0, 1, 0));
    return this.lookAt;
  }

  draw_ui(context, program_state, shapes, materials, score, timer) {
    let camera_matrix = Mat4.inverse(this.lookAt);
    
    // Crosshair
    let string = "+";
    let crosshair_transform = camera_matrix.times(Mat4.translation(0, 0, -1)).times(Mat4.scale(0.02, 0.02, 0.02));
    shapes.text.set_string(string, context.context);
    shapes.text.draw(
      context,
      program_state,
      crosshair_transform,
      materials.text_image
    );

    // Top left score
    string = `Score: ${score}`;
    let score_transform = camera_matrix.times(Mat4.translation(-0.7, 0.37, -1)).times(Mat4.scale(0.02, 0.02, 0.02));
    shapes.text.set_string(string, context.context);
    shapes.text.draw(
      context,
      program_state,
      score_transform,
      materials.score_text
    );

    // Top right timer
    string = `Timer: ${timer}`;
    let timer_transform = camera_matrix.times(Mat4.translation(0.45, 0.37, -1)).times(Mat4.scale(0.02, 0.02, 0.02));
    shapes.text.set_string(string, context.context);
    shapes.text.draw(
      context,
      program_state,
      timer_transform,
      materials.timer_text
    );
  }
}