export const PanoItemTypes = {
  LINK: { classSuffix: 'link', title: 'Link', icon: 'link.svg' },
  TEXT: { classSuffix: 'text', title: 'Text', icon: 'text.svg' },
  EMOJI: { classSuffix: 'emoji', title: 'Emoji', icon: 'emoji.svg' },
  FILE: { classSuffix: 'file', title: 'File', icon: 'file.svg' },
  IMAGE: { classSuffix: 'image', title: 'Image', icon: 'image.svg' },
  CODE: { classSuffix: 'code', title: 'Code', icon: 'code.svg' },
  COLOR: { classSuffix: 'color', title: 'Color', icon: 'color.svg' },
};

export interface IPanoItemType {
  classSuffix: string;
  title: string;
  icon: string;
}
