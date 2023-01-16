export const PanoItemTypes = {
  LINK: { classSuffix: 'link', title: 'Link', icon: 'link-symbolic.svg' },
  TEXT: { classSuffix: 'text', title: 'Text', icon: 'text-symbolic.svg' },
  EMOJI: { classSuffix: 'emoji', title: 'Emoji', icon: 'emoji-symbolic.svg' },
  FILE: { classSuffix: 'file', title: 'File', icon: 'file-symbolic.svg' },
  IMAGE: { classSuffix: 'image', title: 'Image', icon: 'image-symbolic.svg' },
  CODE: { classSuffix: 'code', title: 'Code', icon: 'code-symbolic.svg' },
  COLOR: { classSuffix: 'color', title: 'Color', icon: 'color-symbolic.svg' },
};

export interface IPanoItemType {
  classSuffix: string;
  title: string;
  icon: string;
}
