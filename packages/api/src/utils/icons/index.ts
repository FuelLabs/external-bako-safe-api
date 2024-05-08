import path from 'path';
import dotenv from 'dotenv';

const envPath = path.resolve(process.cwd(), `.env.${process.env.NODE_ENV}`);

dotenv.config({ path: envPath });
const { ASSETS_URL } = process.env;

enum IconType {
  WORKSPACE = 'workspaces',
  USERS = 'users',
}

type FileType = 'jpg';
type IconFile = `${number}.${FileType}`;

const ICONS_LENGTH = 1500;

const randomNumber = () => Math.floor(Math.random() * ICONS_LENGTH);

class IconUtils {
  static generatePath(type: IconType, file: IconFile) {
    return `${ASSETS_URL}/${type}/${file}`;
  }

  static workspace(fileType: FileType = 'jpg') {
    const iconName: IconFile = `${randomNumber()}.${fileType}`;
    return this.generatePath(IconType.WORKSPACE, iconName);
  }

  static user(fileType: FileType = 'jpg') {
    const iconName: IconFile = `${randomNumber()}.${fileType}`;
    return this.generatePath(IconType.USERS, iconName);
  }
}

export { IconUtils };
