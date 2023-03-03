export default class Target {
    constructor(x, y,z,time_created, exposure_time) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.time_created=time_created;
        this.exposure_time=exposure_time;
        console.log("created new target");
    }
}