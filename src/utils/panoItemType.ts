export const PanoItemTypes = {
  LINK: { classSuffix: 'link', title: 'Link', icon: 'link.svg' },
  TEXT: { classSuffix: 'text', title: 'Text', icon: 'text.svg' },
  FILE: { classSuffix: 'file', title: 'File', icon: 'file.svg' },
  IMAGE: { classSuffix: 'image', title: 'Image', icon: 'image.svg' },
  CODE: { classSuffix: 'code', title: 'Code', icon: 'code.svg' },
};

export interface IPanoItemType {
  classSuffix: string;
  title: string;
  icon: string;
}
