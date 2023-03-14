import { tiny } from "./examples/common.js";
const {Mat4} = tiny

export default function DisplayBackground (context, program_state, shapes, materials) {

  let draw_sky = () => {
      let model_transform = Mat4.identity();
      model_transform = model_transform.times(Mat4.scale(40, 40, 40));
      shapes.cube.draw(context, program_state, model_transform, materials.sky);
  }
  let draw_ground = () => {
      let model_transform = Mat4.identity();
      model_transform = model_transform.times(Mat4.translation(0, -5, 0)).times(Mat4.scale(40, 40, 40));
      shapes.desert_plane.draw(context, program_state, model_transform, materials.ground);
  }
  let draw_sun = () => {
      let model_transform = Mat4.identity();
      model_transform = model_transform.times(Mat4.translation(10, 30, -30)).times(Mat4.scale(3, 3, 3));
      // The parameters of the Light are: position, color, size
      shapes.sphere.draw(context, program_state, model_transform, materials.sun);
  }
  let draw_rocks = () => {
      let model_transform = Mat4.identity();
      model_transform = model_transform.times(Mat4.translation(-10, -4, -15));
      shapes.rock.draw(context, program_state, model_transform, materials.rock);
      model_transform = model_transform.times(Mat4.translation(-2, 0, -2).times(Mat4.scale(2,2,2)));
      shapes.rock.draw(context, program_state, model_transform, materials.rock);
      model_transform = model_transform.times(Mat4.translation(2, 0, 2));
      shapes.rock.draw(context, program_state, model_transform, materials.rock);
  }
  let draw_cacti = () => {
      let model_transform = Mat4.identity();
      model_transform = model_transform.times(Mat4.translation(15, -4, -15).times(Mat4.scale(1,1,1)));
      shapes.blocky_cactus.draw(context, program_state, model_transform, materials.cactus);
      model_transform = model_transform.times(Mat4.translation(0, 0, 0).times(Mat4.scale(1,1,1)));
      shapes.cactus.draw(context, program_state, model_transform, materials.cactus);
      model_transform = model_transform.times(Mat4.translation(1, 1, 0).times(Mat4.scale(0.25,0.25,0.25)));
      shapes.cactus.draw(context, program_state, model_transform, materials.cactus);
      model_transform = model_transform.times(Mat4.translation(-2, 1, 0).times(Mat4.scale(2,2,2)));
      shapes.cactus.draw(context, program_state, model_transform, materials.cactus);        
  }
  draw_sky();
  draw_ground();
  draw_sun();
  draw_rocks();
  draw_cacti();
}