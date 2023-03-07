// Defines a first person camera with 
import { tiny } from "./examples/common.js";
const {vec3, Mat4} = tiny
export default class FirstPersonCamera {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.at = vec3(0, 0, 1);
    this.lookAt = Mat4.look_at(vec3(x, y, z), this.at, vec3(0, 1, 0));
    
    this.theta = 0;
    this.phi = 0;
    this.mouse_prev_x = 0;
    this.mouse_prev_y = 0;
  }

  rotateZ(theta) {
    return Mat4.rotation(theta, 0, 0, 1);
  }
  rotateY(phi) {
    return Mat4.rotation(phi, 0, 1, 0);
  }


  // Updates the camera's position based on the mouse's position
  update_view(mouse_x, mouse_y, sensitivity) {
    this.theta += (mouse_x - this.mouse_prev_x) * (sensitivity + 2);
    this.phi += (mouse_y - this.mouse_prev_y) * (sensitivity + 2);
    this.mouse_prev_x = mouse_x;
    this.mouse_prev_y = mouse_y;

    this.at = vec3(this.theta, this.phi, 1);
    this.lookAt = Mat4.look_at(vec3(this.x, this.y, this.z), this.at, vec3(0, 1, 0));

    return this.lookAt;
  }
}