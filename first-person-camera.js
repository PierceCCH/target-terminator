// Defines a first person camera with 
import { tiny } from "./examples/common.js";
const {vec3, Mat4} = tiny
export default class FirstPersonCamera {
  constructor(x, y, z) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.lookAt = Mat4.look_at(vec3(x, y, z), vec3(0, 0, 0), vec3(0, 1, 0));
    
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
  update_view(mouse_x, mouse_y) {
    this.theta += (mouse_x - this.mouse_prev_x) / 1000;
    this.phi += (mouse_y - this.mouse_prev_y) / 10000;
    this.mouse_prev_x = mouse_x;
    this.mouse_prev_y = mouse_y;

    this.lookAt = this.lookAt.times(this.rotateY(this.theta).times(this.rotateZ(this.phi)));
    return this.lookAt;
  }
}