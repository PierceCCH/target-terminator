// Displayed the main menu screen for game state 0

import { tiny } from "./examples/common.js";
const {Mat4} = tiny

export default function DisplayMenu (context, program_state, options, shapes, materials) {
  const toggleShapes = options.toggleShapes;
  const sensitivity = options.sensitivity;

  // Background
  let background_transform = Mat4.identity();
  background_transform = background_transform
    .times(Mat4.translation(0, 0, -10))
    .times(Mat4.scale(20, 20, 0.2));
  shapes.cube.draw(
    context,
    program_state,
    background_transform,
    materials.texture
  );

  // Standard for all option texts
  let option_text_transform = Mat4.identity();
  option_text_transform = option_text_transform
    .times(Mat4.translation(0.1, -0.9, 0))
    .times(Mat4.scale(0.12, 0.5, 0));

  // Play Button
  let play_button_transform = Mat4.identity();
  play_button_transform = play_button_transform
    .times(Mat4.translation(-3, 0, 0))
    .times(Mat4.scale(2, 0.7, 0.2))
    .times(Mat4.rotation(0.15, 0, 1, 0));
  shapes.cube.draw(
    context,
    program_state,
    play_button_transform,
    materials.menu_button
  );
  const cube_side = Mat4.rotation(0, 1, 0, 0)
    .times(Mat4.rotation(0, 0, 1, 0))
    .times(Mat4.translation(-0.9, 0.9, 1.01));
  let string = "PLAY";
  // Draw a Text_String for every line in our string, up to 30 lines:
  shapes.text.set_string(string, context.context);
  shapes.text.draw(
    context,
    program_state,
    play_button_transform
      .times(cube_side)
      .times(Mat4.translation(0.4, -0.9, 0))
      .times(Mat4.scale(0.2, 0.4, 0)),
    materials.text_image
  );

  // Toggle Cube button
  let cube_button_transform = Mat4.identity();
  cube_button_transform = cube_button_transform
    .times(Mat4.translation(4, 3, 0))
    .times(Mat4.scale(1.7, 0.5, 0.2))
    .times(Mat4.rotation(-0.15, -1, 1, 0));
  shapes.cube.draw(
    context,
    program_state,
    cube_button_transform,
    materials.menu_button
  );
  string = "Cubes:" + (toggleShapes.cube ? "On" : "Off");
  shapes.text.set_string(string, context.context);
  shapes.text.draw(
    context,
    program_state,
    cube_button_transform.times(cube_side).times(option_text_transform),
    materials.text_image
  );

  // Toggle Sphere button
  let sphere_button_transform = cube_button_transform;
  sphere_button_transform = sphere_button_transform.times(
    Mat4.translation(0, -3, 0)
  );
  shapes.cube.draw(
    context,
    program_state,
    sphere_button_transform,
    materials.menu_button
  );
  string = "Spheres:" + (toggleShapes.sphere ? "On" : "Off");
  shapes.text.set_string(string, context.context);
  shapes.text.draw(
    context,
    program_state,
    sphere_button_transform.times(cube_side).times(option_text_transform),
    materials.text_image
  );

  // Toggle Donut button
  let donut_button_transform = sphere_button_transform;
  donut_button_transform = donut_button_transform.times(
    Mat4.translation(0, -3, 0)
  );
  shapes.cube.draw(
    context,
    program_state,
    donut_button_transform,
    materials.menu_button
  );
  string = "Donuts:" + (toggleShapes.donut ? "On" : "Off");
  shapes.text.set_string(string, context.context);
  shapes.text.draw(
    context,
    program_state,
    donut_button_transform.times(cube_side).times(option_text_transform),
    materials.text_image
  );

  // Toggle Teapot button
  let teapot_button_transform = donut_button_transform;
  teapot_button_transform = teapot_button_transform.times(
    Mat4.translation(0, -3, 0)
  );
  shapes.cube.draw(
    context,
    program_state,
    teapot_button_transform,
    materials.menu_button
  );
  string = "Teapots:" + (toggleShapes.teapot ? "On" : "Off");
  shapes.text.set_string(string, context.context);
  shapes.text.draw(
    context,
    program_state,
    teapot_button_transform.times(cube_side).times(option_text_transform),
    materials.text_image
  );

  // Cycle Difficulty button
  let difficulty_button_transform = teapot_button_transform;
  difficulty_button_transform = difficulty_button_transform.times(
    Mat4.translation(0, -3, 0)
  );
  shapes.cube.draw(
    context,
    program_state,
    difficulty_button_transform,
    materials.menu_button
  );
  let difficulty = "Easy";
  switch (options.difficulty) {
    case 1:
      difficulty = "Easy";
      break;
    case 2:
      difficulty = "Medium";
      break;
    case 3:
      difficulty = "Hard";
      break;
  }
  string = difficulty;
  shapes.text.set_string(string, context.context);
  shapes.text.draw(
    context,
    program_state,
    difficulty_button_transform.times(cube_side).times(option_text_transform),
    materials.text_image
  );

  // Cycle sensitivity button
  let sensitivity_button_transform = difficulty_button_transform;
  sensitivity_button_transform = sensitivity_button_transform.times(
    Mat4.translation(0, -3, 0)
  );
  shapes.cube.draw(
    context,
    program_state,
    sensitivity_button_transform,
    materials.menu_button
  );
  string = "Sensitivity:" + sensitivity;
  shapes.text.set_string(string, context.context);
  shapes.text.draw(
    context,
    program_state,
    sensitivity_button_transform
      .times(cube_side)
      .times(option_text_transform),
    materials.text_image
  );
}
