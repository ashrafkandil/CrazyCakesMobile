# Home Hero Carousel

## Goal

The home-page carousel has been updated to show each cake photo in full, in its own original orientation, without stretching or cropping it. The carousel keeps its slides, order, swipe/paging behavior, and automatic advance.

## What it does today

The carousel fills almost the entire visible screen and renders each image with `cover`. `cover` preserves image proportions, but enlarges the image until the frame is full, cropping parts that do not fit. On a tall portrait screen, a landscape cake photo can therefore look excessively zoomed or cut off; it is not necessarily being distorted.

## Implemented design

1. **Responsive frame:** Carousel height is calculated from the current window width and height, with separate sizing for portrait and landscape and a maximum height of 560 points.
2. **Full image:** Slides use `contain` so Expo Image preserves the complete photo and its aspect ratio.
3. **Consistent page background:** The carousel frame is transparent, allowing the app's existing page background and watermark pattern to show through any letterboxed space.
4. **Unchanged slide experience:** The same four images, sequence, paging, swipe gestures, and 6.5-second auto-advance remain. The title, description, and buttons stay below the carousel.
5. **Rotation handling:** The frame and slide width adapt to window changes, and the current slide index is retained when the device rotates.

Expo SDK 57's `expo-image` supports `contentFit="contain"` for fitting an image inside its frame without cropping. This is the key behavior change; the responsive frame and background treatment provide the visual polish.

## Trade-off

Showing every pixel of photos with different aspect ratios in one consistent frame necessarily leaves some unused space around some images. That space now shows the same background and watermark treatment as the surrounding app pages. Filling every pixel of the frame instead would require cropping some photos (`cover`), so it cannot guarantee the full image is always visible.

## Verification checklist

- Test on a narrow portrait phone and a landscape phone or rotated device.
- Check both landscape and portrait source photos.
- Confirm the entire cake/photo is visible, proportions look natural, and the source orientation is retained.
- Confirm rotation does not stretch, crop, blank, or reset the carousel unexpectedly.
- Confirm swipe/paging and automatic slide changes still work.
- Confirm the text and buttons remain below the carousel and do not overlap it.

## References

- Current carousel implementation: [`src/screens/HomeScreen.tsx`](./src/screens/HomeScreen.tsx)
- Expo SDK 57 Image docs: <https://docs.expo.dev/versions/v57.0.0/sdk/image/>
