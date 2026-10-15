import type { ImageRequireSource } from "react-native";

const imageRegistry: Record<string, number> = {
  "/assets/crazy/celebration-1.JPEG": require("../../assets/images/celebration-1.jpeg"),
  "/assets/crazy/Celebrations/0_IMG_3530.JPEG": require("../../assets/images/Celebrations/0_IMG_3530.jpeg"),
  "/assets/crazy/Celebrations/1_IMG_4901.JPEG": require("../../assets/images/Celebrations/1_IMG_4901.jpeg"),
  "/assets/crazy/Celebrations/10_IMG_2454.JPEG": require("../../assets/images/Celebrations/10_IMG_2454.jpeg"),
  "/assets/crazy/Celebrations/11_IMG_1731.JPEG": require("../../assets/images/Celebrations/11_IMG_1731.jpeg"),
  "/assets/crazy/Celebrations/12_IMG_4928.JPEG": require("../../assets/images/Celebrations/12_IMG_4928.jpeg"),
  "/assets/crazy/Celebrations/13_IMG_3518.JPEG": require("../../assets/images/Celebrations/13_IMG_3518.jpeg"),
  "/assets/crazy/Celebrations/14_IMG_4022.JPEG": require("../../assets/images/Celebrations/14_IMG_4022.jpeg"),
  "/assets/crazy/Celebrations/15_IMG_4917.JPEG": require("../../assets/images/Celebrations/15_IMG_4917.jpeg"),
  "/assets/crazy/Celebrations/16_IMG_4918.JPEG": require("../../assets/images/Celebrations/16_IMG_4918.jpeg"),
  "/assets/crazy/Celebrations/17_IMG_4838.JPEG": require("../../assets/images/Celebrations/17_IMG_4838.jpeg"),
  "/assets/crazy/Celebrations/18_IMG_4865_white_background.JPEG": require("../../assets/images/Celebrations/18_IMG_4865_white_background.jpeg"),
  "/assets/crazy/Celebrations/19_IMG_4910.JPEG": require("../../assets/images/Celebrations/19_IMG_4910.jpeg"),
  "/assets/crazy/Celebrations/2_IMG_4897.JPEG": require("../../assets/images/Celebrations/2_IMG_4897.jpeg"),
  "/assets/crazy/Celebrations/20_IMG_4920.JPEG": require("../../assets/images/Celebrations/20_IMG_4920.jpeg"),
  "/assets/crazy/Celebrations/21_IMG_4899.JPEG": require("../../assets/images/Celebrations/21_IMG_4899.jpeg"),
  "/assets/crazy/Celebrations/22_IMG_4967.jpg": require("../../assets/images/Celebrations/22_IMG_4967.jpg"),
  "/assets/crazy/Celebrations/23_IMG_4932.JPEG": require("../../assets/images/Celebrations/23_IMG_4932.jpeg"),
  "/assets/crazy/Celebrations/24_IMG_1378.JPEG": require("../../assets/images/Celebrations/24_IMG_1378.jpeg"),
  "/assets/crazy/Celebrations/25_IMG_2634.JPEG": require("../../assets/images/Celebrations/25_IMG_2634.jpeg"),
  "/assets/crazy/Celebrations/26_IMG_4869.JPG": require("../../assets/images/Celebrations/26_IMG_4869.jpg"),
  "/assets/crazy/Celebrations/27_IMG_4929.JPEG": require("../../assets/images/Celebrations/27_IMG_4929.jpeg"),
  "/assets/crazy/Celebrations/28_IMG_4966.jpg": require("../../assets/images/Celebrations/28_IMG_4966.jpg"),
  "/assets/crazy/Celebrations/29_IMG_2544.JPEG": require("../../assets/images/Celebrations/29_IMG_2544.jpeg"),
  "/assets/crazy/Celebrations/3_IMG_4923.JPEG": require("../../assets/images/Celebrations/3_IMG_4923.jpeg"),
  "/assets/crazy/Celebrations/4_IMG_4937.JPEG": require("../../assets/images/Celebrations/4_IMG_4937.jpeg"),
  "/assets/crazy/Celebrations/5_IMG_4873.JPEG": require("../../assets/images/Celebrations/5_IMG_4873.jpeg"),
  "/assets/crazy/Celebrations/6_IMG_4884.JPEG": require("../../assets/images/Celebrations/6_IMG_4884.jpeg"),
  "/assets/crazy/Celebrations/8_IMG_0811.JPEG": require("../../assets/images/Celebrations/8_IMG_0811.jpeg"),
  "/assets/crazy/Celebrations/9_IMG_4909.JPEG": require("../../assets/images/Celebrations/9_IMG_4909.jpeg"),
  "/assets/crazy/Cupcakes & more/0_IMG_4858.JPEG": require("../../assets/images/Cupcakes & more/0_IMG_4858.jpeg"),
  "/assets/crazy/Cupcakes & more/1_IMG_4926.JPEG": require("../../assets/images/Cupcakes & more/1_IMG_4926.jpeg"),
  "/assets/crazy/Cupcakes & more/3_IMG_2565.JPEG": require("../../assets/images/Cupcakes & more/3_IMG_2565.jpeg"),
  "/assets/crazy/Cupcakes & more/4_IMG_2566.JPEG": require("../../assets/images/Cupcakes & more/4_IMG_2566.jpeg"),
  "/assets/crazy/Cupcakes & more/5_IMG_4872.JPEG": require("../../assets/images/Cupcakes & more/5_IMG_4872.jpeg"),
  "/assets/crazy/Graduation/0_IMG_4849.JPEG": require("../../assets/images/Graduation/0_IMG_4849.jpeg"),
  "/assets/crazy/Graduation/1_IMG_4935.JPEG": require("../../assets/images/Graduation/1_IMG_4935.jpeg"),
  "/assets/crazy/Graduation/2_IMG_4936.JPEG": require("../../assets/images/Graduation/2_IMG_4936.jpeg"),
  "/assets/crazy/hero-1.jpg": require("../../assets/images/hero-1.jpg"),
  "/assets/crazy/hero-2.jpg": require("../../assets/images/hero-2.jpg"),
  "/assets/crazy/hero-3.jpg": require("../../assets/images/hero-3.jpg"),
  "/assets/crazy/hero-4.jpg": require("../../assets/images/hero-4.jpg"),
  "/assets/crazy/Kids/0_IMG_4839.JPEG": require("../../assets/images/Kids/0_IMG_4839.jpeg"),
  "/assets/crazy/Kids/1_IMG_4876.JPEG": require("../../assets/images/Kids/1_IMG_4876.jpeg"),
  "/assets/crazy/Kids/2_IMG_4896.JPEG": require("../../assets/images/Kids/2_IMG_4896.jpeg"),
  "/assets/crazy/Kids/3_IMG_4913.JPEG": require("../../assets/images/Kids/3_IMG_4913.jpeg"),
  "/assets/crazy/Kids/4_IMG_2520.JPEG": require("../../assets/images/Kids/4_IMG_2520.jpeg"),
  "/assets/crazy/Kids/5_IMG_4968.jpg": require("../../assets/images/Kids/5_IMG_4968.jpg"),
  "/assets/crazy/Kids/6_IMG_4914.JPEG": require("../../assets/images/Kids/6_IMG_4914.jpeg"),
  "/assets/crazy/Kids/7_IMG_4886.JPEG": require("../../assets/images/Kids/7_IMG_4886.jpeg"),
  "/assets/crazy/Kids/8_IMG_4845.JPEG": require("../../assets/images/Kids/8_IMG_4845.jpeg"),
  "/assets/crazy/logo.png": require("../../assets/images/logo.png"),
  "/assets/crazy/Marwa.png": require("../../assets/images/Marwa.png"),
  "/assets/crazy/pricing.jpeg": require("../../assets/images/pricing.jpeg"),
  "/assets/crazy/Sculpted/0_IMG_4944.JPEG": require("../../assets/images/Sculpted/0_IMG_4944.jpeg"),
  "/assets/crazy/Sculpted/1_IMG_4940.JPEG": require("../../assets/images/Sculpted/1_IMG_4940.jpeg"),
  "/assets/crazy/Sculpted/2_IMG_4903.JPEG": require("../../assets/images/Sculpted/2_IMG_4903.jpeg"),
  "/assets/crazy/Sculpted/3_IMG_4969.jpg": require("../../assets/images/Sculpted/3_IMG_4969.jpg"),
  "/assets/crazy/Sculpted/4_IMG_4854.JPEG": require("../../assets/images/Sculpted/4_IMG_4854.jpeg"),
  "/assets/crazy/Sculpted/5_IMG_6282.JPEG": require("../../assets/images/Sculpted/5_IMG_6282.jpeg"),
  "/assets/crazy/Sculpted/6_IMG_4942.JPEG": require("../../assets/images/Sculpted/6_IMG_4942.jpeg"),
  "/assets/crazy/Sculpted/7_IMG_3524.JPEG": require("../../assets/images/Sculpted/7_IMG_3524.jpeg"),
  "/assets/crazy/Sculpted/8_IMG_4933.JPEG": require("../../assets/images/Sculpted/8_IMG_4933.jpeg"),
  "/assets/crazy/Sculpted/9_IMG_4898.JPEG": require("../../assets/images/Sculpted/9_IMG_4898.jpeg"),
  "/assets/crazy/Testimony.png": require("../../assets/images/Testimony.png"),
  "/assets/crazy/Wedding/0_IMG_4922.JPEG": require("../../assets/images/Wedding/0_IMG_4922.jpeg"),
};

const videoRegistry: Record<string, number> = {
  "/assets/videos/0_cake-finish.mp4": require("../../assets/videos/0_cake-finish.mp4"),
  "/assets/videos/1_cake-detail.mp4": require("../../assets/videos/1_cake-detail.mp4"),
};

function normalizedPath(src: string) {
  return decodeURIComponent((src.split("?")[0] ?? src).replaceAll("\\", "/"));
}

export function imageFor(src: string): ImageRequireSource | undefined {
  const resource = imageRegistry[normalizedPath(src)];
  return resource === undefined ? undefined : (resource as ImageRequireSource);
}

export function videoFor(src: string): number | undefined {
  return videoRegistry[normalizedPath(src)];
}
