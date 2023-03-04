export const PanoItemTypes = {
  LINK: { classSuffix: 'link', title: 'Link', iconPath: 'link-symbolic.svg', iconName: 'link-symbolic' },
  TEXT: { classSuffix: 'text', title: 'Text', iconPath: 'text-symbolic.svg', iconName: 'text-symbolic' },
  EMOJI: { classSuffix: 'emoji', title: 'Emoji', iconPath: 'emoji-symbolic.svg', iconName: 'emoji-symbolic' },
  FILE: { classSuffix: 'file', title: 'File', iconPath: 'file-symbolic.svg', iconName: 'file-symbolic' },
  IMAGE: { classSuffix: 'image', title: 'Image', iconPath: 'image-symbolic.svg', iconName: 'image-symbolic' },
  CODE: { classSuffix: 'code', title: 'Code', iconPath: 'code-symbolic.svg', iconName: 'code-symbolic' },
  COLOR: { classSuffix: 'color', title: 'Color', iconPath: 'color-symbolic.svg', iconName: 'color-symbolic' },
};

export interface IPanoItemType {
  classSuffix: string;
  title: string;
  iconName: string;
  iconPath: string;
}
