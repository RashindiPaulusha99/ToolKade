import type { ToolContent } from '@/tools/types';

export const content: ToolContent = {
  intro:
    'Compress JPG, PNG and WebP images in your browser. Choose the quality, shrink large photos to a maximum width, convert to WebP or JPG, and download them one by one or all together as a ZIP.',
  howTo: [
    'Click the box to choose images, or drag and drop them in. You can add up to 50 images at once.',
    'Set the quality. Around 70–80% usually looks the same as the original while making the file much smaller.',
    'Optionally enter a maximum width, for example 1920 pixels, to scale down large camera photos.',
    'Pick an output format: keep the original format, or convert to WebP for the smallest files or JPG for the widest compatibility.',
    'Check the new size and the percentage saved for each image, then download each one or click "Download all (ZIP)".',
  ],
  howItWorks: [
    'JPG and WebP are "lossy" formats: they save space by discarding fine detail the eye barely notices. The quality setting controls how much is discarded. Small reductions from 100% save a lot of space with no visible change; very low settings start to show blocky edges and blur.',
    'Resizing is often the biggest saving. A modern phone photo can be 4,000 pixels or more wide, but a website, email or document rarely needs more than 1,600–2,000. Halving the width cuts the number of pixels to a quarter.',
    'PNG is lossless, so the quality setting does not apply. Photos saved as PNG are usually much smaller as JPG or WebP; for screenshots and graphics with transparency, keep PNG and resize instead. If re-encoding would make a file bigger, the tool keeps your original.',
    'Everything happens in your browser using its built-in image engine, so your photos are never uploaded. Re-encoding also removes hidden data such as camera details and GPS location.',
  ],
  faqs: [
    {
      q: 'Does compressing an image reduce its quality?',
      a: 'With JPG and WebP, slightly, but at sensible settings (70–85%) the difference is very hard to see. Compare the result before you delete your originals, and keep the originals of photos that matter to you.',
    },
    {
      q: 'Which format gives the smallest file?',
      a: 'WebP usually produces the smallest files at the same visual quality, and all modern browsers support it. Use JPG if the image must open in older software, and PNG for graphics that need transparency or sharp text.',
    },
    {
      q: 'Are my images uploaded to a server?',
      a: 'No. The images are processed by your own browser on your device. Nothing is sent to ToolKade or anyone else, so the tool also works for private photos and documents.',
    },
    {
      q: 'Why did my PNG not get smaller?',
      a: 'PNG is lossless, so re-saving it at the same size rarely helps. To make it smaller, set a maximum width, or convert it to WebP or JPG if it does not need transparency.',
    },
    {
      q: 'Can I compress iPhone HEIC photos?',
      a: 'Not yet. This tool supports JPG, PNG and WebP. On an iPhone you can choose "Most Compatible" in the camera settings to save photos as JPG, or share them as JPG first.',
    },
  ],
};
