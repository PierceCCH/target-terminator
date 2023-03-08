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
}