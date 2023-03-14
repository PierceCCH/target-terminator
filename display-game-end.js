import { tiny } from "./examples/common.js";
const { Mat4, hex_color } = tiny;

export default function DisplayGameEnd(
  context,
  program_state,
  shapes,
  materials,
  score
) {
  //draw background
  let background_transform = Mat4.identity();
  background_transform = background_transform
    .times(Mat4.translation(0, 0, -10))
    .times(Mat4.scale(20, 20, 0.2));
  shapes.cube.draw(
    context,
    program_state,
    background_transform,
    materials.menu_background
  );

  //draw game over header
  let header1 = "GAME OVER!";
  let header1_transform = Mat4.identity()
    .times(Mat4.translation(-3.3, 2, 0))
    .times(Mat4.scale(0.5, 0.5, 0.5));
  shapes.text.set_string(header1, context.context);
  shapes.text.draw(
    context,
    program_state,
    header1_transform,
    materials.header_text_image
  );

  //draw score header + actual score
  let score_header = "Score";
  let score_color = hex_color("#00FF00");
  let score_header_transform = Mat4.identity()
    .times(Mat4.translation(-1.9, 1, 0))
    .times(Mat4.scale(0.5, 0.5, 0.5));
  shapes.text.set_string(score_header, context.context);
  shapes.text.draw(
    context,
    program_state,
    score_header_transform,
    materials.header_text_image.override({ color: score_color })
  );
  let score_actual = " " + score;
  let score_actual_transform = score_header_transform.times(
    Mat4.translation(0, -2, 0)
  );
  shapes.text.set_string(score_actual, context.context);
  shapes.text.draw(
    context,
    program_state,
    score_actual_transform,
    materials.header_text_image.override({ color: score_color })
  );
}
