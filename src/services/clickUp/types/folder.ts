export interface ClickUpList {
  id: string;
  name: string;
}

export interface ClickUpFolder {
  id: string;
  name: string;
  lists: ClickUpList[];
}
