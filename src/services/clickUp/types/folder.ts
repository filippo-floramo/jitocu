export interface ClickUpList {
  id: string;
  name: string;
}

export interface ClickUpFolder {
  id: string;
  name: string;
  lists: ClickUpList[];
}

/** A list lifted out of its folder, carrying the folder name in `name`. */
export interface ClickUpFlatList {
  id: string;
  name: string;
}
