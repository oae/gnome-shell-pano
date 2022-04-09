export const PanoItemTypes = {
  LINK: { classSuffix: 'link', title: 'Link' },
  TEXT: { classSuffix: 'text', title: 'Text' },
  FILE: { classSuffix: 'file', title: 'File' },
  IMAGE: { classSuffix: 'image', title: 'Image' },
};

export interface IPanoItemType {
  classSuffix: string;
  title: string;
}
